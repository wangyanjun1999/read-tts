import express from 'express';
import cors from 'cors';
import multer from 'multer';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import http from 'http';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use('/examples', express.static(path.join(__dirname)));

// 添加一个路由来提供示例文件
app.get('/download-example', (req, res) => {
  const filePath = path.join(__dirname, 'example-words.csv');
  res.download(filePath, 'example-words.csv');
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// 确保目录存在
const outputDir = path.join(__dirname, 'output');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 处理Excel/CSV文件上传
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // 读取Excel/CSV文件
    const workbook = XLSX.readFile(filePath, {
      type: 'file',
      raw: true,
      cellDates: true,
      cellNF: false,
      cellText: false
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // 将Excel/CSV数据转换为JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: ['word', 'definition'],
      raw: false,
      defval: ''
    });

    console.log('文件数据:', jsonData);

    // 跳过标题行（如果有）
    const data = jsonData
      .filter(row => row.word && row.word !== 'word') // 过滤掉空行和标题行
      .map((row, index) => ({
        id: index + 1,
        text: row.word,
        translation: row.definition || ''
      }));

    console.log('处理后的数据:', data);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取可用的声音列表
app.get('/voices', (req, res) => {
  try {
    // 定义常用的声音
    const voices = {
      'en-US': [
        { id: 'en-US-ChristopherNeural', name: 'Christopher (男)' },
        { id: 'en-US-EricNeural', name: 'Eric (男)' },
        { id: 'en-US-GuyNeural', name: 'Guy (男)' },
        { id: 'en-US-JennyNeural', name: 'Jenny (女)' },
        { id: 'en-US-AriaNeural', name: 'Aria (女)' },
      ],
      'fr-FR': [
        { id: 'fr-FR-HenriNeural', name: 'Henri (男)' },
        { id: 'fr-FR-AlainNeural', name: 'Alain (男)' },
        { id: 'fr-FR-DeniseNeural', name: 'Denise (女)' },
        { id: 'fr-FR-EloiseNeural', name: 'Eloise (女)' },
      ]
    };

    res.json({ success: true, voices });
  } catch (error) {
    console.error('Error getting voices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 生成单个TTS音频
async function generateSingleTTS(text, language = 'en-US', voice) {
  if (!text) {
    throw new Error('Text is required');
  }

  // 生成文件名 - 使用文本的哈希值作为文件名的一部分，以便缓存
  const textHash = Buffer.from(text).toString('base64').replace(/[/+=]/g, '_');
  const fileName = `${language}_${textHash}.mp3`;
  const filePath = path.join(outputDir, fileName);

  // 如果文件已经存在，直接返回
  if (fs.existsSync(filePath)) {
    return {
      success: true,
      audioUrl: `/output/${fileName}`,
      text,
      language,
      cached: true
    };
  }

  // 选择合适的声音
  let voiceId = voice;
  if (!voiceId) {
    // 默认声音
    if (language === 'fr-FR') {
      voiceId = 'fr-FR-HenriNeural';
    } else {
      voiceId = 'en-US-ChristopherNeural';
    }
  }

  // 使用 Python 脚本调用 edge-tts
  const cmd = `python tts.py "${text}" "${voiceId}" "${filePath}"`;

  try {
    console.log('执行命令:', cmd);
    await execPromise(cmd);

    return {
      success: true,
      audioUrl: `/output/${fileName}`,
      text,
      language,
      cached: false,
      method: 'python-script'
    };
  } catch (error) {
    console.error('Python script error:', error);
    throw error;
  }
}

// 生成TTS音频API
app.post('/generate-tts', async (req, res) => {
  try {
    const { text, language = 'en-US', voice } = req.body;
    const result = await generateSingleTTS(text, language, voice);
    res.json(result);
  } catch (error) {
    console.error('Error generating TTS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量生成TTS音频API
app.post('/batch-generate-tts', async (req, res) => {
  try {
    const { texts, language = 'en-US', voice, batchSize = 5 } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ success: false, error: 'Texts array is required' });
    }

    // 创建一个响应对象，用于存储结果
    const results = [];

    // 检查哪些音频已经存在
    const existingAudios = [];
    const pendingTexts = [];

    for (const text of texts) {
      const textHash = Buffer.from(text).toString('base64').replace(/[/+=]/g, '_');
      const fileName = `${language}_${textHash}.mp3`;
      const filePath = path.join(outputDir, fileName);

      if (fs.existsSync(filePath)) {
        existingAudios.push({
          text,
          audioUrl: `/output/${fileName}`,
          cached: true
        });
      } else {
        pendingTexts.push(text);
      }
    }

    // 先返回已经存在的音频信息
    res.json({
      success: true,
      completed: existingAudios.length,
      total: texts.length,
      results: existingAudios,
      pending: pendingTexts.length,
      message: `Found ${existingAudios.length} cached audios, generating ${pendingTexts.length} new audios`
    });

    // 如果没有需要生成的音频，直接返回
    if (pendingTexts.length === 0) {
      return;
    }

    // 分批处理剩余的文本
    const batches = [];
    for (let i = 0; i < pendingTexts.length; i += batchSize) {
      batches.push(pendingTexts.slice(i, i + batchSize));
    }

    // 创建一个进度更新函数
    const progressUpdateInterval = setInterval(() => {
      console.log(`批量生成进度: ${results.length}/${pendingTexts.length}`);
    }, 2000);

    try {
      // 逐批处理
      for (const batch of batches) {
        const batchResults = await Promise.all(
          batch.map(text => generateSingleTTS(text, language, voice)
            .catch(error => ({
              success: false,
              text,
              error: error.message
            }))
          )
        );

        results.push(...batchResults);

        // 短暂延迟，避免过度占用系统资源
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`批量生成完成，总共生成 ${results.length} 个音频文件`);
    } finally {
      // 确保清除进度更新定时器
      clearInterval(progressUpdateInterval);
    }

  } catch (error) {
    console.error('Error batch generating TTS:', error);
    // 这里不返回错误，因为响应已经发送
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

import { useState, useEffect, useRef } from 'react';
import { Layout, Typography, message, ConfigProvider, theme, Button, Upload, Space, Progress, notification } from 'antd';
import { UploadOutlined, SoundOutlined } from '@ant-design/icons';
import './App.css';

// 导入组件
import WordCard from './components/WordCard';
import PlayControls from './components/PlayControls';
import ExampleSentence from './components/ExampleSentence';
import LanguageSelector from './components/LanguageSelector';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  // 状态管理
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [interval, setInterval] = useState(3);
  const [playMode, setPlayMode] = useState('sequential');
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('fr-FR'); // 默认法语
  const [selectedVoice, setSelectedVoice] = useState('');
  const [infiniteLoop, setInfiniteLoop] = useState(false); // 无限循环状态

  // 音频预生成状态
  const [preGenerating, setPreGenerating] = useState(false);
  const [preGenerateProgress, setPreGenerateProgress] = useState(0);
  const [preGenerateTotal, setPreGenerateTotal] = useState(0);
  const [audioCache, setAudioCache] = useState({});
  const [audioQueue, setAudioQueue] = useState([]);
  const [batchSize, setBatchSize] = useState(5); // 每批处理的音频数量

  // 引用
  const audioRef = useRef(new Audio());
  const timerRef = useRef(null);
  const playCountRef = useRef(0);
  const audioQueueRef = useRef([]);

  // 获取当前单词
  const currentWord = words.length > 0 ? words[currentIndex] : null;

  // 处理文件上传成功
  const handleFileUploaded = (data) => {
    setWords(data);
    setCurrentIndex(0);
    message.success(`成功加载 ${data.length} 个单词/短语`);

    // 自动开始预生成音频
    preGenerateAudios(data);
  };

  // 批量预生成音频
  const preGenerateAudios = async (wordsData) => {
    if (!wordsData || wordsData.length === 0) return;

    try {
      setPreGenerating(true);
      setPreGenerateProgress(0);
      setPreGenerateTotal(wordsData.length);

      // 提取所有单词文本
      const texts = wordsData.map(word => word.text);

      // 检查哪些单词已经有缓存
      const cachedTexts = Object.keys(audioCache);
      const uncachedTexts = texts.filter(text => !cachedTexts.includes(text));

      // 如果所有单词都已缓存，直接返回
      if (uncachedTexts.length === 0) {
        notification.success({
          message: '音频预生成完成',
          description: `所有 ${texts.length} 个音频已在缓存中`,
          duration: 3,
        });
        setPreGenerateProgress(texts.length);
        setPreGenerating(false);
        return;
      }

      // 调用批量生成API，只处理未缓存的单词
      const response = await fetch('http://localhost:3001/batch-generate-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: uncachedTexts, // 只发送未缓存的单词
          language: selectedLanguage,
          voice: selectedVoice,
          batchSize
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 更新进度 - 包括已有缓存的数量
        const totalCompleted = data.completed + (texts.length - uncachedTexts.length);
        setPreGenerateProgress(totalCompleted);

        // 将已缓存的音频添加到缓存对象
        const newCache = { ...audioCache };
        data.results.forEach(result => {
          newCache[result.text] = result.audioUrl;
        });
        setAudioCache(newCache);

        // 如果还有待处理的音频，显示通知
        if (data.pending > 0) {
          notification.open({
            message: '音频预生成',
            description: `已找到 ${totalCompleted} 个缓存音频，正在后台生成剩余 ${data.pending} 个音频...`,
            icon: <SoundOutlined style={{ color: '#108ee9' }} />,
            duration: 3,
          });
        } else {
          notification.success({
            message: '音频预生成完成',
            description: `所有 ${texts.length} 个音频已准备就绪`,
            duration: 3,
          });
          setPreGenerating(false);
        }
      }
    } catch (error) {
      console.error('预生成音频失败:', error);
      message.error('预生成音频失败');
      setPreGenerating(false);
    }
  };

  // 播放音频
  const playAudio = async (text, language = null, isAutoPlay = false, forcePlay = false) => {
    try {
      // 如果当前正在播放音频，且不是强制播放，则不允许播放
      if (audioPlaying && !forcePlay) {
        console.log(`当前正在播放音频，不允许播放: "${text}", forcePlay=${forcePlay}`);
        return;
      }

      setAudioPlaying(true);
      console.log(`开始播放音频: "${text}", 自动播放: ${isAutoPlay}, forcePlay=${forcePlay}`);

      // 使用传入的语言或默认选择的语言
      const langToUse = language || selectedLanguage;

      // 先设置自动播放标志，确保在播放开始前就已设置
      audioRef.current.isAutoPlay = isAutoPlay;

      // 检查缓存中是否已有该音频
      if (audioCache[text]) {
        console.log('使用缓存的音频:', text);

        // 停止当前播放的音频
        audioRef.current.pause();

        // 设置新的音频源
        audioRef.current.src = `http://localhost:3001${audioCache[text]}`;

        // 设置错误处理
        audioRef.current.onerror = (error) => {
          console.error('播放音频失败:', error);
          message.error('播放音频失败');
          setAudioPlaying(false);
        };

        // 播放音频
        try {
          await audioRef.current.play();
        } catch (playError) {
          console.error('播放音频时出错:', playError);
          // 尝试重新加载并播放
          audioRef.current.load();
          await audioRef.current.play();
        }

        return;
      }

      // 缓存中没有，使用后端的edge-tts生成
      console.log(`生成新音频: "${text}"`);
      const response = await fetch('http://localhost:3001/generate-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language: langToUse,
          voice: selectedVoice
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 添加到缓存
        const newCache = { ...audioCache };
        newCache[text] = data.audioUrl;
        setAudioCache(newCache);

        // 停止当前播放的音频
        audioRef.current.pause();

        // 设置新的音频源
        audioRef.current.src = `http://localhost:3001${data.audioUrl}`;

        // 设置错误处理
        audioRef.current.onerror = (error) => {
          console.error('播放音频失败:', error);
          message.error('播放音频失败');
          setAudioPlaying(false);
        };

        // 播放音频
        try {
          await audioRef.current.play();
        } catch (playError) {
          console.error('播放音频时出错:', playError);
          // 尝试重新加载并播放
          audioRef.current.load();
          await audioRef.current.play();
        }
      } else {
        throw new Error(data.error || '生成音频失败');
      }
    } catch (error) {
      console.error('播放音频失败:', error);
      message.error('播放音频失败');
      setAudioPlaying(false);
    }
  };

  // 预加载下一批音频
  const preloadNextBatch = () => {
    if (words.length === 0) return;

    // 确定要预加载的单词索引
    const nextIndices = [];
    let nextIndex = currentIndex;

    // 根据播放模式预加载不同的单词
    for (let i = 0; i < batchSize; i++) {
      if (playMode === 'sequential') {
        nextIndex = (nextIndex + 1) % words.length;
      } else if (playMode === 'random') {
        nextIndex = Math.floor(Math.random() * words.length);
      }
      nextIndices.push(nextIndex);
    }

    // 提取要预加载的单词文本
    const textsToPreload = nextIndices.map(idx => words[idx].text);

    // 更新音频队列
    audioQueueRef.current = textsToPreload;
    setAudioQueue(textsToPreload);

    // 预加载这些单词的音频
    textsToPreload.forEach(text => {
      if (!audioCache[text]) {
        // 如果缓存中没有，异步预加载
        fetch('http://localhost:3001/generate-tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            language: selectedLanguage,
            voice: selectedVoice
          }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // 添加到缓存
            setAudioCache(prev => ({
              ...prev,
              [text]: data.audioUrl
            }));
          }
        })
        .catch(error => {
          console.error('预加载音频失败:', error);
        });
      }
    });
  };

  // 播放当前单词
  const playCurrentWord = (forcePlay = false) => {
    if (currentWord) {
      // 如果当前正在播放音频，不允许再次播放
      // 但如果是强制播放（自动播放触发的），则允许播放
      if (audioPlaying && !forcePlay) {
        console.log(`当前正在播放音频，等待播放完成，forcePlay=${forcePlay}`);
        return;
      }

      console.log(`播放当前单词: "${currentWord.text}", 索引: ${currentIndex}, 播放次数: ${playCountRef.current + 1}/${repeatCount}, forcePlay=${forcePlay}`);

      // 使用当前选择的语言，并标记为自动播放，同时传入forcePlay参数
      playAudio(currentWord.text, null, true, forcePlay);

      // 增加播放计数
      playCountRef.current++;
      console.log(`播放计数更新为: ${playCountRef.current}`);

      // 预加载下一批音频
      preloadNextBatch();
    } else {
      console.warn('没有当前单词可播放');
    }
  };

  // 开始播放
  const handlePlay = () => {
    setIsPlaying(true);
    playCountRef.current = 0;

    // 预加载下一批音频
    preloadNextBatch();

    // 开始播放当前单词
    playCurrentWord(true);
  };

  // 暂停播放
  const handlePause = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // 下一个单词
  const handleNext = (forceNext = false) => {
    if (words.length === 0) return;

    // 如果当前正在播放音频，不允许切换
    // 但如果是强制切换（自动播放触发的），则允许切换
    if (audioPlaying && !forceNext) {
      // 如果是手动切换，显示提示信息
      if (!audioRef.current.isAutoPlay) {
        message.info('请等待当前音频播放完成');
      }
      console.log(`handleNext: 当前正在播放音频，不允许切换，forceNext=${forceNext}`);
      return;
    }

    // 清除任何现有的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    console.log(`切换到下一个单词，forceNext=${forceNext}`);

    if (playMode === 'sequential') {
      setCurrentIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % words.length;
        console.log(`顺序播放: ${prevIndex} -> ${newIndex}`);
        return newIndex;
      });
    } else if (playMode === 'random') {
      setCurrentIndex((prevIndex) => {
        const randomIndex = Math.floor(Math.random() * words.length);
        console.log(`随机播放: ${prevIndex} -> ${randomIndex}`);
        return randomIndex;
      });
    }

    // 重置播放计数
    playCountRef.current = 0;
  };

  // 上一个单词
  const handlePrev = () => {
    if (words.length === 0) return;

    // 如果当前正在播放音频，不允许切换
    if (audioPlaying) {
      message.info('请等待当前音频播放完成');
      return;
    }

    // 清除任何现有的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    console.log('切换到上一个单词');

    if (playMode === 'sequential') {
      setCurrentIndex((prevIndex) => {
        const newIndex = (prevIndex - 1 + words.length) % words.length;
        console.log(`顺序播放: ${prevIndex} -> ${newIndex}`);
        return newIndex;
      });
    } else if (playMode === 'random') {
      setCurrentIndex((prevIndex) => {
        const randomIndex = Math.floor(Math.random() * words.length);
        console.log(`随机播放: ${prevIndex} -> ${randomIndex}`);
        return randomIndex;
      });
    }

    // 重置播放计数
    playCountRef.current = 0;
  };

  // 当当前单词变化时重置播放计数
  useEffect(() => {
    // 重置播放计数
    playCountRef.current = 0;
  }, [currentIndex]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // 当音频播放结束时的处理
  useEffect(() => {
    const handleAudioEnded = () => {
      console.log(`音频播放结束事件触发: isPlaying=${isPlaying}, isAutoPlay=${audioRef.current.isAutoPlay}, playCount=${playCountRef.current}, repeatCount=${repeatCount}, audioPlaying=${audioPlaying}`);

      // 音频播放完成后，设置audioPlaying为false
      setAudioPlaying(false);
      console.log('设置audioPlaying为false');

      // 只有在自动播放模式下才继续播放
      if (isPlaying && audioRef.current.isAutoPlay) {
        console.log('自动播放模式，继续播放');

        // 如果是无限循环模式或者还没达到重复次数，继续播放当前单词
        if (infiniteLoop || playCountRef.current < repeatCount) {
          console.log(`继续播放当前单词: 当前播放次数=${playCountRef.current}, 目标次数=${repeatCount}`);

          // 清除任何现有的定时器
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }

          // 在指定间隔后再次播放当前单词
          // 关键修改：音频播放完成后才开始计时间隔
          timerRef.current = setTimeout(() => {
            if (isPlaying) {
              console.log(`定时器触发: 播放当前单词`);
              playCurrentWord(true);
            }
          }, interval * 1000);
        } else {
          // 已达到重复次数，移动到下一个单词
          console.log(`已达到重复次数(${playCountRef.current}/${repeatCount})，准备移动到下一个单词`);
          playCountRef.current = 0;

          // 清除任何现有的定时器
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }

          // 设置定时器，在指定间隔后移动到下一个单词
          // 关键修改：音频播放完成后才开始计时间隔，然后再切换到下一个单词
          timerRef.current = setTimeout(() => {
            console.log('定时器触发: 移动到下一个单词');
            // 保存当前播放状态
            const wasPlaying = isPlaying;

            // 使用handleNext函数，并传入forceNext=true参数
            // 这样可以强制切换到下一个单词，即使audioPlaying为true
            handleNext(true);

            // 移动到下一个单词后，继续播放
            if (wasPlaying) {
              console.log('继续播放新的单词');
              // 使用短暂延迟，确保状态已更新
              setTimeout(() => {
                if (isPlaying) {
                  playCurrentWord(true);
                }
              }, 200);
            }
          }, interval * 1000);
        }
      } else {
        console.log('非自动播放模式或已暂停，不继续播放');
      }
    };

    // 添加事件监听器
    console.log('设置音频播放结束事件监听器');
    audioRef.current.addEventListener('ended', handleAudioEnded);

    return () => {
      console.log('移除音频播放结束事件监听器');
      audioRef.current.removeEventListener('ended', handleAudioEnded);
    };
  }, [isPlaying, repeatCount, interval, playMode, currentIndex, words.length, infiniteLoop, handleNext, playCurrentWord]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: '#1e1e1e'
        }}>
          <Title level={3} style={{ margin: 0, color: 'white' }}>
            单词卡片
          </Title>
        </Header>

        <Content style={{ padding: '24px', background: '#121212' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Upload
                    name="file"
                    action="http://localhost:3001/upload"
                    accept=".xlsx, .xls, .csv"
                    showUploadList={true}
                    maxCount={1}
                    onChange={(info) => {
                      if (info.file.status === 'done') {
                        if (info.file.response && info.file.response.success) {
                          handleFileUploaded(info.file.response.data);
                          message.success(`${info.file.name} 上传成功`);
                        }
                      } else if (info.file.status === 'error') {
                        message.error(`${info.file.name} 上传失败`);
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />}>上传Excel/CSV文件</Button>
                  </Upload>

                  <Button
                    type="link"
                    onClick={() => window.open('http://localhost:3001/download-example')}
                  >
                    下载示例CSV文件
                  </Button>

                  {words.length > 0 && (
                    <Button
                      type="primary"
                      icon={<SoundOutlined />}
                      onClick={() => preGenerateAudios(words)}
                      loading={preGenerating}
                    >
                      预生成所有音频
                    </Button>
                  )}
                </Space>

                {preGenerating && (
                  <div style={{ marginTop: 12 }}>
                    <Progress
                      percent={Math.round((preGenerateProgress / preGenerateTotal) * 100)}
                      status="active"
                      format={() => `${preGenerateProgress}/${preGenerateTotal}`}
                    />
                    <div style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 4 }}>
                      正在预生成音频，请稍候...
                    </div>
                  </div>
                )}
              </Space>
            </div>

            <LanguageSelector
              language={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              voice={selectedVoice}
              onVoiceChange={setSelectedVoice}
            />

            {words.length > 0 && (
              <>
                <PlayControls
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onRepeatChange={setRepeatCount}
                  onIntervalChange={setInterval}
                  onPlayModeChange={setPlayMode}
                  onShowTranslationChange={setShowTranslation}
                  onInfiniteLoopChange={setInfiniteLoop}
                  repeatCount={repeatCount}
                  interval={interval}
                  playMode={playMode}
                  showTranslation={showTranslation}
                  infiniteLoop={infiniteLoop}
                />

                <WordCard
                  word={currentWord.text}
                  translation={currentWord.translation}
                  index={currentIndex + 1}
                  total={words.length}
                  onPlayAudio={playAudio}
                  audioPlaying={audioPlaying}
                  showTranslation={showTranslation}
                  language={selectedLanguage}
                />

                {/* 示例句子组件 - 如果有示例句子的话 */}
                {currentWord.example && (
                  <ExampleSentence
                    sentence={currentWord.example}
                    translation={currentWord.exampleTranslation}
                    onPlayAudio={playAudio}
                    audioPlaying={audioPlaying}
                    highlightWord={currentWord.text}
                  />
                )}
              </>
            )}
          </div>
        </Content>

        <Footer style={{ textAlign: 'center', background: '#1e1e1e', color: '#aaa' }}>
          单词卡片 ©{new Date().getFullYear()} 使用 Edge TTS 技术
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

export default App;

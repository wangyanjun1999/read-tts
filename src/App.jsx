import { Layout, Typography, ConfigProvider, theme, Button, Upload, Space, Progress, notification } from 'antd';
import { UploadOutlined, SoundOutlined } from '@ant-design/icons';
import './App.css';
import '@ant-design/v5-patch-for-react-19';
// 导入重构后的组件
import WordCard from './features/wordList/components/WordCard';
import PlayControls from './features/playback/components/PlayControls';
import ExampleSentence from './features/wordList/components/ExampleSentence';
import LanguageSelector from './features/preferences/components/LanguageSelector';

// 导入 stores 和 effects
import { useWordListStore } from './features/wordList/store';
import { useAudioGenerationStore } from './features/audioGeneration/store';
import { WordListEffects } from './features/wordList/effects';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  // 从 stores 获取必要的状态
  const words = useWordListStore(state => state.words);
  const currentWord = useWordListStore(state => state.getCurrentWord());
  
  const {
    preGenerating,
    preGenerateProgress,
    preGenerateTotal,
    getProgressPercentage
  } = useAudioGenerationStore();

  // 处理文件上传
  const handleFileUpload = (info) => {
    if (info.file.status === 'done') {
      if (info.file.response && info.file.response.success) {
        WordListEffects.handleFileUploaded(info.file.response.data);
      }
    } else if (info.file.status === 'error') {
      notification.error({
        message: '上传失败',
        description: `${info.file.name} 上传失败`
      });
    }
  };

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
            {/* 文件上传区域 */}
            <div style={{ marginBottom: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Upload
                    name="file"
                    action="http://localhost:3001/upload"
                    accept=".xlsx, .xls, .csv"
                    showUploadList={true}
                    maxCount={1}
                    onChange={handleFileUpload}
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
                      onClick={() => WordListEffects.preGenerateAudios(words)}
                      loading={preGenerating}
                    >
                      预生成所有音频
                    </Button>
                  )}
                </Space>

                {/* 音频生成进度 */}
                {preGenerating && (
                  <div style={{ marginTop: 12 }}>
                    <Progress
                      percent={getProgressPercentage()}
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

            {/* 语言选择器 */}
            <LanguageSelector />

            {/* 主要内容区域 */}
            {words.length > 0 && (
              <>
                {/* 播放控制 */}
                <PlayControls />

                {/* 单词卡片 */}
                <WordCard />

                {/* 示例句子 - 如果有的话 */}
                {currentWord?.example && (
                  <ExampleSentence />
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
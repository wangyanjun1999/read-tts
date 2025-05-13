import { useState, useEffect } from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { SoundOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const WordCard = ({
  word,
  translation,
  index,
  total,
  onPlayAudio,
  audioPlaying,
  showTranslation = false,
  language = 'en-US'
}) => {
  const [isFlipped, setIsFlipped] = useState(showTranslation);

  // 当showTranslation属性变化时更新isFlipped状态
  useEffect(() => {
    setIsFlipped(showTranslation);
  }, [showTranslation]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <Card
      style={{
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: '#1e1e1e',
        color: 'white',
        border: '1px solid #333',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
      }}
      bodyStyle={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ position: 'absolute', top: 16, left: 16 }}>
        <Text style={{ color: '#aaa' }}>{index}/{total}</Text>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ color: 'white', marginBottom: 16 }}>
          {word}
        </Title>

        <Button
          type="text"
          icon={<SoundOutlined />}
          size="large"
          onClick={() => onPlayAudio(word, language)}
          loading={audioPlaying}
          style={{ color: '#1890ff' }}
        >
          发音 {language === 'fr-FR' ? '(法语)' : '(英语)'}
        </Button>
      </div>

      {isFlipped && (
        <div style={{
          marginTop: 24,
          padding: '16px 24px',
          background: '#2a2a2a',
          borderRadius: 8,
          width: '100%',
          textAlign: 'center'
        }}>
          <Text style={{ color: '#ddd', fontSize: 18 }}>{translation}</Text>
        </div>
      )}

      <Space style={{ marginTop: 24 }}>
        <Button onClick={handleFlip}>
          {isFlipped ? '隐藏翻译' : '显示翻译'}
        </Button>
      </Space>
    </Card>
  );
};

export default WordCard;

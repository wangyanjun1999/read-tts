import { Card, Typography, Button } from 'antd';
import { SoundOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

const ExampleSentence = ({ 
  sentence, 
  translation, 
  onPlayAudio, 
  audioPlaying,
  highlightWord
}) => {
  // 如果有高亮单词，将其在句子中高亮显示
  const renderHighlightedSentence = () => {
    if (!highlightWord || !sentence.includes(highlightWord)) {
      return sentence;
    }
    
    const parts = sentence.split(new RegExp(`(${highlightWord})`, 'i'));
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === highlightWord.toLowerCase()) {
        return <Text key={index} style={{ color: '#1890ff', fontWeight: 'bold' }}>{part}</Text>;
      }
      return part;
    });
  };
  
  return (
    <Card
      style={{
        width: '100%',
        maxWidth: 600,
        margin: '16px auto',
        background: '#2a2a2a',
        border: '1px solid #333',
        borderRadius: 8,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Paragraph style={{ color: '#ddd', fontSize: 16, marginBottom: 8 }}>
          {renderHighlightedSentence()}
        </Paragraph>
        
        <Button 
          type="text" 
          icon={<SoundOutlined />} 
          size="small"
          onClick={() => onPlayAudio(sentence)}
          loading={audioPlaying}
          style={{ color: '#1890ff' }}
        >
          播放例句
        </Button>
      </div>
      
      {translation && (
        <Paragraph style={{ color: '#aaa', fontSize: 14 }}>
          {translation}
        </Paragraph>
      )}
    </Card>
  );
};

export default ExampleSentence;

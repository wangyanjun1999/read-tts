import { Card, Typography, Button } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { useCurrentWord } from '../../../shared/hooks/useStores';
import { usePreferencesStore } from '../../preferences/store';
import { useAudioStore } from '../../audio/store';
import { audioEffects } from '../../audio/effects';

const { Text, Paragraph } = Typography;

const ExampleSentence = () => {
  const { word: currentWord, index } = useCurrentWord();
  const language = usePreferencesStore(state => state.selectedLanguage);
  const audioPlaying = useAudioStore(state => state.audioPlaying);
  
  if (!currentWord?.example) {
    return null;
  }
  
  const { example: sentence, exampleTranslation: translation, text: highlightWord } = currentWord;
  
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
        <Text type="secondary" style={{ fontSize: 12 }}>示例句子</Text>
      </div>
      
      <Paragraph style={{ 
        fontSize: 18, 
        marginBottom: 16,
        color: '#ddd'
      }}>
        {renderHighlightedSentence()}
      </Paragraph>
      
      <Button
        type="text"
        icon={<SoundOutlined />}
        onClick={() => audioEffects.playAudio(sentence, language, false, false, index)}
        loading={audioPlaying}
        style={{ color: '#1890ff' }}
      >
        播放句子
      </Button>
      
      {translation && (
        <div style={{
          marginTop: 16,
          padding: '12px',
          background: '#1e1e1e',
          borderRadius: 4
        }}>
          <Text style={{ color: '#aaa' }}>{translation}</Text>
        </div>
      )}
    </Card>
  );
};

export default ExampleSentence;
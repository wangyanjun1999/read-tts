import { Radio, Space, Select } from 'antd';
import { useState, useEffect } from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import { usePreferencesStore } from '../store';

const LanguageSelector = () => {
  const { 
    selectedLanguage, 
    selectedVoice, 
    setLanguage, 
    setVoice 
  } = usePreferencesStore();
  
  const [voices, setVoices] = useState({
    'en-US': [],
    'fr-FR': []
  });
  
  // 获取可用的声音列表
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('http://localhost:3001/voices');
        const data = await response.json();
        
        if (data.success) {
          setVoices(data.voices);
        }
      } catch (error) {
        console.error('获取声音列表失败:', error);
      }
    };
    
    fetchVoices();
  }, []);
  
  // 当语言变化时，自动选择该语言的第一个声音
  useEffect(() => {
    if (voices[selectedLanguage]?.length > 0 && !selectedVoice) {
      setVoice(voices[selectedLanguage][0].id);
    }
  }, [selectedLanguage, voices, selectedVoice, setVoice]);
  
  return (
    <div style={{ 
      padding: '16px',
      background: '#2a2a2a',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space align="center">
          <GlobalOutlined />
          <span>选择语言：</span>
          <Radio.Group 
            value={selectedLanguage} 
            onChange={(e) => setLanguage(e.target.value)}
          >
            <Radio.Button value="en-US">英语</Radio.Button>
            <Radio.Button value="fr-FR">法语</Radio.Button>
          </Radio.Group>
        </Space>
        
        <Space align="center">
          <span>选择声音：</span>
          <Select
            value={selectedVoice}
            onChange={setVoice}
            style={{ width: 200 }}
            placeholder="选择声音"
            allowClear
          >
            {voices[selectedLanguage]?.map(v => (
              <Select.Option key={v.id} value={v.id}>
                {v.name}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Space>
    </div>
  );
};

export default LanguageSelector;
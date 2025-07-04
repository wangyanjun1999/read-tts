import { Drawer, List, Typography, Space, Tag, Empty, Badge } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useEffect, useRef } from 'react';
import { useWordListStore } from '../../wordList/store';
import { usePlaybackStore } from '../../playback/store';
import { useAudioStore } from '../../audio/store';

const { Text } = Typography;

const PlaylistPanel = ({ visible, onClose }) => {
  const listRef = useRef(null);
  const itemRefs = useRef({});

  // 从 stores 获取状态
  const words = useWordListStore(state => state.words);
  const currentIndex = useWordListStore(state => state.currentIndex);
  const setCurrentIndex = useWordListStore(state => state.setCurrentIndex);
  const playMode = usePlaybackStore(state => state.playMode);
  const isPlaying = usePlaybackStore(state => state.isPlaying);
  const playingIndex = useAudioStore(state => state.playingIndex);
  
  // 计算显示顺序（顺序或随机）
  const displayList = words.map((word, index) => ({
    ...word,
    originalIndex: index,
    isActive: index === currentIndex,
    isPlaying: index === playingIndex && isPlaying,
    isPassed: index < currentIndex
  }));

  // 自动滚动到当前播放项
  useEffect(() => {
    if (visible && currentIndex >= 0 && itemRefs.current[currentIndex]) {
      itemRefs.current[currentIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [visible, currentIndex]);

  // 处理点击跳转
  const handleItemClick = (index) => {
    setCurrentIndex(index);
    // 如果正在播放，音频系统会自动处理切换
    onClose(); // 可选：跳转后关闭面板
  };

  // 渲染列表项
  const renderItem = (item, index) => {
    const { word, phonetic, translation, originalIndex, isActive, isPlaying, isPassed } = item;
    
    return (
      <List.Item
        ref={el => itemRefs.current[originalIndex] = el}
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          backgroundColor: isActive ? 'rgba(197, 208, 218, 0.1)' : 'transparent',
          borderLeft: isActive ? '3px solid #1890ff' : '3px solid transparent',
          transition: 'all 0.3s',
          opacity: isPassed && !isActive ? 0.6 : 1
        }}
        onClick={() => handleItemClick(originalIndex)}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'rgba(157, 62, 62, 0.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <Space style={{ width: '100%' }} direction="vertical" size={4}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Text 
                style={{ 
                  minWidth: 30,
                  color: isActive ? '#1890ff' : '#666'
                }}
              >
                {originalIndex + 1}.
              </Text>
              <Text 
                strong 
                style={{ 
                  fontSize: 16,
                  color: isActive ? '#1890ff' : isPassed ? '#888' : '#fff'
                }}
              >
                {word}
              </Text>
              {phonetic && (
                <Text type="secondary" style={{ fontSize: 14 }}>
                  [{phonetic}]
                </Text>
              )}
            </Space>
            <Space>
              {isPlaying && (
                <PlayCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} spin />
              )}
              {isPassed && !isActive && (
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
              )}
            </Space>
          </Space>
          {translation && (
            <Text 
              type="secondary" 
              style={{ 
                paddingLeft: 38,
                fontSize: 13,
                color: isActive ? '#8db8ff' : '#999'
              }}
            >
              {translation}
            </Text>
          )}
        </Space>
      </List.Item>
    );
  };

  return (
    <Drawer
      title={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>播放列表</span>
          <Space>
            <Tag color={playMode === 'random' ? 'orange' : 'blue'}>
              {playMode === 'random' ? '随机' : '顺序'}
            </Tag>
            <Badge 
              count={`${currentIndex + 1}/${words.length}`} 
              style={{ backgroundColor: '#52c41a' }}
            />
          </Space>
        </Space>
      }
      placement="right"
      width={350}
      onClose={onClose}
      open={visible}
      bodyStyle={{ padding: 0 }}
    >
      {words.length === 0 ? (
        <Empty 
          description="暂无单词" 
          style={{ marginTop: 100 }}
        />
      ) : (
        <List
          ref={listRef}
          dataSource={displayList}
          renderItem={renderItem}
          style={{ height: '100%', overflow: 'auto' }}
        />
      )}
    </Drawer>
  );
};

export default PlaylistPanel;
import { Button, Space, Select, InputNumber, Tooltip, Switch, Checkbox } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  ReloadOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  SyncOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import { usePlaybackStore } from '../store';
import { usePreferencesStore } from '../../preferences/store';
import { useWordListStore } from '../../wordList/store';
import { audioEffects } from '../../audio/effects';
import { WordListEffects } from '../../wordList/effects';
import PlaylistPanel from '../../playlist/components/PlaylistPanel';

const PlayControls = () => {
  // 播放列表面板状态
  const [playlistVisible, setPlaylistVisible] = useState(false);
  // 从 stores 获取状态和方法
  const {
    isPlaying,
    playMode,
    repeatCount,
    interval,
    infiniteLoop,
    startPlayback,
    pausePlayback,
    setPlayMode,
    setRepeatCount,
    setInterval,
    toggleInfiniteLoop
  } = usePlaybackStore();
  
  const { showTranslation, toggleTranslation } = usePreferencesStore();
  const { nextWord, prevWord, getCurrentWord, currentIndex } = useWordListStore();
  
  // 处理播放
  const handlePlay = () => {
    startPlayback();
    const currentWord = getCurrentWord();
    if (currentWord) {
      audioEffects.playAudio(currentWord.text, null, true, true, currentIndex);
      WordListEffects.preloadNextBatch(); // 预加载下一批
    }
  };
  
  // 处理暂停
  const handlePause = () => {
    pausePlayback();
    audioEffects.pauseAudio();
  };
  
  // 处理下一个
  const handleNext = () => {
    const newIndex = nextWord(playMode);
    if (isPlaying) {
      const currentWord = getCurrentWord();
      if (currentWord) {
        audioEffects.playAudio(currentWord.text, null, false, false, newIndex);
      }
    }
  };
  
  // 处理上一个
  const handlePrev = () => {
    const newIndex = prevWord(playMode);
    if (isPlaying) {
      const currentWord = getCurrentWord();
      if (currentWord) {
        audioEffects.playAudio(currentWord.text, null, false, false, newIndex);
      }
    }
  };

  return (
    <div style={{
      padding: '16px',
      background: '#2a2a2a',
      borderRadius: '8px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Space wrap>
        <Button
          type="primary"
          icon={<StepBackwardOutlined />}
          onClick={handlePrev}
        >
          上一个
        </Button>

        {isPlaying ? (
          <Button
            type="primary"
            danger
            icon={<PauseCircleOutlined />}
            onClick={handlePause}
          >
            暂停
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handlePlay}
          >
            播放
          </Button>
        )}

        <Button
          type="primary"
          icon={<StepForwardOutlined />}
          onClick={handleNext}
        >
          下一个
        </Button>

        <Tooltip title="查看播放列表">
          <Button
            icon={<MenuOutlined />}
            onClick={() => setPlaylistVisible(true)}
          >
            播放列表
          </Button>
        </Tooltip>
      </Space>

      <Space wrap align="center">
        <Tooltip title="播放模式">
          <Select
            value={playMode}
            onChange={setPlayMode}
            style={{ width: 120 }}
            options={[
              { value: 'sequential', label: <><OrderedListOutlined /> 顺序播放</> },
              { value: 'random', label: <><UnorderedListOutlined /> 随机播放</> },
            ]}
          />
        </Tooltip>

        <Tooltip title="重复次数">
          <Space>
            <ReloadOutlined />
            <InputNumber
              min={1}
              max={10}
              value={repeatCount}
              onChange={setRepeatCount}
              style={{ width: 60 }}
              disabled={infiniteLoop}
            />
            <span>次</span>
          </Space>
        </Tooltip>

        <Tooltip title="无限循环">
          <Space>
            <SyncOutlined spin={infiniteLoop} />
            <Checkbox
              checked={infiniteLoop}
              onChange={toggleInfiniteLoop}
            >
              无限循环
            </Checkbox>
          </Space>
        </Tooltip>

        <Tooltip title="间隔时间(秒)">
          <Space>
            <span>间隔</span>
            <InputNumber
              min={1}
              max={10}
              value={interval}
              onChange={setInterval}
              style={{ width: 60 }}
            />
            <span>秒</span>
          </Space>
        </Tooltip>

        <Tooltip title="显示翻译">
          <Space>
            <span>显示翻译</span>
            <Switch
              checked={showTranslation}
              onChange={toggleTranslation}
            />
          </Space>
        </Tooltip>
      </Space>

      {/* 播放列表面板 */}
      <PlaylistPanel 
        visible={playlistVisible} 
        onClose={() => setPlaylistVisible(false)} 
      />
    </div>
  );
};

export default PlayControls;
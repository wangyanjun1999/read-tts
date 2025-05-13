import { Button, Space, Select, InputNumber, Tooltip, Switch, Checkbox } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  ReloadOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  SyncOutlined
} from '@ant-design/icons';

const PlayControls = ({
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onRepeatChange,
  onIntervalChange,
  onPlayModeChange,
  onShowTranslationChange,
  onInfiniteLoopChange,
  repeatCount = 1,
  interval = 1,
  playMode = 'sequential',
  showTranslation = false,
  infiniteLoop = false
}) => {
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
          onClick={onPrev}
        >
          上一个
        </Button>

        {isPlaying ? (
          <Button
            type="primary"
            danger
            icon={<PauseCircleOutlined />}
            onClick={onPause}
          >
            暂停
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={onPlay}
          >
            播放
          </Button>
        )}

        <Button
          type="primary"
          icon={<StepForwardOutlined />}
          onClick={onNext}
        >
          下一个
        </Button>
      </Space>

      <Space wrap align="center">
        <Tooltip title="播放模式">
          <Select
            value={playMode}
            onChange={onPlayModeChange}
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
              onChange={onRepeatChange}
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
              onChange={(e) => onInfiniteLoopChange(e.target.checked)}
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
              onChange={onIntervalChange}
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
              onChange={onShowTranslationChange}
            />
          </Space>
        </Tooltip>
      </Space>
    </div>
  );
};

export default PlayControls;

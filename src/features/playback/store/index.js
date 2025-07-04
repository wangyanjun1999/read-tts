import { create } from 'zustand';

/**
 * 播放控制 Store
 * 管理播放控制相关状态
 */
export const usePlaybackStore = create((set, get) => ({
  // 状态
  isPlaying: false,          // 是否正在播放
  playMode: 'sequential',    // 播放模式: sequential | random
  repeatCount: 1,            // 重复次数
  interval: 3,               // 间隔时间（秒）
  infiniteLoop: false,       // 无限循环
  playCount: 0,              // 当前单词播放次数（内部计数）
  timerRef: null,            // 定时器引用
  
  // 开始播放
  startPlayback: () => {
    set({ 
      isPlaying: true,
      playCount: 0  // 重置播放计数
    });
  },
  
  // 暂停播放
  pausePlayback: () => {
    set({ isPlaying: false });
    
    // 清除定时器
    const { timerRef } = get();
    if (timerRef) {
      clearTimeout(timerRef);
      set({ timerRef: null });
    }
  },
  
  // 停止播放（完全停止）
  stopPlayback: () => {
    set({ 
      isPlaying: false,
      playCount: 0
    });
    
    // 清除定时器
    const { timerRef } = get();
    if (timerRef) {
      clearTimeout(timerRef);
      set({ timerRef: null });
    }
  },
  
  // 设置播放模式
  setPlayMode: (mode) => {
    if (['sequential', 'random'].includes(mode)) {
      set({ playMode: mode });
    }
  },
  
  // 设置重复次数
  setRepeatCount: (count) => {
    if (count > 0) {
      set({ repeatCount: count });
    }
  },
  
  // 设置间隔时间
  setInterval: (seconds) => {
    if (seconds >= 0) {
      set({ interval: seconds });
    }
  },
  
  // 切换无限循环
  toggleInfiniteLoop: () => {
    set((state) => ({ infiniteLoop: !state.infiniteLoop }));
  },
  
  // 设置无限循环
  setInfiniteLoop: (loop) => {
    set({ infiniteLoop: loop });
  },
  
  // 增加播放计数
  incrementPlayCount: () => {
    set((state) => ({ playCount: state.playCount + 1 }));
    return get().playCount;
  },
  
  // 重置播放计数
  resetPlayCount: () => {
    set({ playCount: 0 });
  },
  
  // 设置定时器引用
  setTimerRef: (ref) => {
    // 清除旧定时器
    const { timerRef } = get();
    if (timerRef) {
      clearTimeout(timerRef);
    }
    set({ timerRef: ref });
  },
  
  // 检查是否应该继续播放当前单词
  shouldRepeatCurrent: () => {
    const { playCount, repeatCount, infiniteLoop } = get();
    return infiniteLoop || playCount < repeatCount;
  },
  
  // 获取播放设置
  getPlaybackSettings: () => {
    const state = get();
    return {
      playMode: state.playMode,
      repeatCount: state.repeatCount,
      interval: state.interval,
      infiniteLoop: state.infiniteLoop
    };
  }
}));
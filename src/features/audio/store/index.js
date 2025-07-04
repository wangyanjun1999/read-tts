import { create } from 'zustand';

/**
 * 音频播放 Store
 * 管理音频播放状态和缓存
 */
export const useAudioStore = create((set, get) => ({
  // 状态
  audioPlaying: false,    // 音频是否正在播放
  playingIndex: -1,       // 正在播放的单词索引
  audioCache: {},         // 音频缓存 { [text]: audioUrl }
  audioQueue: [],         // 预加载队列
  audioRef: null,         // 音频元素引用
  
  // 初始化音频引用
  initAudioRef: (ref) => {
    set({ audioRef: ref });
  },
  
  // 设置播放状态
  setAudioPlaying: (playing) => {
    set({ audioPlaying: playing });
  },
  
  // 设置正在播放的索引
  setPlayingIndex: (index) => {
    set({ playingIndex: index });
  },
  
  // 开始播放音频
  startPlaying: (index) => {
    set({ 
      audioPlaying: true,
      playingIndex: index 
    });
  },
  
  // 停止播放音频
  stopPlaying: () => {
    set({ 
      audioPlaying: false,
      playingIndex: -1 
    });
    
    // 如果有音频引用，暂停并重置
    const { audioRef } = get();
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
  },
  
  // 更新音频缓存
  updateCache: (text, audioUrl) => {
    set((state) => ({
      audioCache: {
        ...state.audioCache,
        [text]: audioUrl
      }
    }));
  },
  
  // 批量更新缓存
  batchUpdateCache: (cacheData) => {
    set((state) => ({
      audioCache: {
        ...state.audioCache,
        ...cacheData
      }
    }));
  },
  
  // 获取缓存的音频URL
  getCachedAudio: (text) => {
    const { audioCache } = get();
    return audioCache[text] || null;
  },
  
  // 检查音频是否已缓存
  isAudioCached: (text) => {
    const { audioCache } = get();
    return !!audioCache[text];
  },
  
  // 设置音频队列
  setAudioQueue: (queue) => {
    set({ audioQueue: queue });
  },
  
  // 清空音频缓存
  clearCache: () => {
    set({ audioCache: {} });
  },
  
  // 判断特定索引是否正在播放
  isIndexPlaying: (index) => {
    const { audioPlaying, playingIndex } = get();
    return audioPlaying && playingIndex === index;
  }
}));
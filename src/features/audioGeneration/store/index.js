import { create } from 'zustand';

/**
 * 音频生成 Store
 * 管理音频预生成状态
 */
export const useAudioGenerationStore = create((set, get) => ({
  // 状态
  preGenerating: false,      // 是否正在预生成
  preGenerateProgress: 0,    // 生成进度
  preGenerateTotal: 0,       // 总数
  batchSize: 5,              // 批量大小
  generationQueue: [],       // 生成队列
  
  // 开始预生成
  startGeneration: (total) => {
    set({ 
      preGenerating: true,
      preGenerateProgress: 0,
      preGenerateTotal: total
    });
  },
  
  // 更新进度
  updateProgress: (progress) => {
    set({ preGenerateProgress: progress });
    
    // 如果进度达到总数，自动结束生成
    const { preGenerateTotal } = get();
    if (progress >= preGenerateTotal) {
      set({ preGenerating: false });
    }
  },
  
  // 增加进度
  incrementProgress: (count = 1) => {
    set((state) => {
      const newProgress = state.preGenerateProgress + count;
      return { 
        preGenerateProgress: newProgress,
        // 如果进度达到总数，自动结束生成
        preGenerating: newProgress < state.preGenerateTotal
      };
    });
  },
  
  // 结束生成
  endGeneration: () => {
    set({ 
      preGenerating: false,
      preGenerateProgress: 0,
      preGenerateTotal: 0
    });
  },
  
  // 设置批量大小
  setBatchSize: (size) => {
    if (size > 0) {
      set({ batchSize: size });
    }
  },
  
  // 设置生成队列
  setGenerationQueue: (queue) => {
    set({ generationQueue: queue });
  },
  
  // 获取生成进度百分比
  getProgressPercentage: () => {
    const { preGenerateProgress, preGenerateTotal } = get();
    if (preGenerateTotal === 0) return 0;
    return Math.round((preGenerateProgress / preGenerateTotal) * 100);
  },
  
  // 获取生成状态
  getGenerationStatus: () => {
    const state = get();
    return {
      isGenerating: state.preGenerating,
      progress: state.preGenerateProgress,
      total: state.preGenerateTotal,
      percentage: state.getProgressPercentage()
    };
  },
  
  // 重置生成状态
  resetGeneration: () => {
    set({
      preGenerating: false,
      preGenerateProgress: 0,
      preGenerateTotal: 0,
      generationQueue: []
    });
  }
}));
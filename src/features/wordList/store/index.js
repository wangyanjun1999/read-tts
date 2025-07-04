import { create } from 'zustand';

/**
 * 单词列表 Store
 * 管理单词数据和导航
 */
export const useWordListStore = create((set, get) => (
  
  
  {
  // 状态
  words: [],              // 单词列表
  currentIndex: 0,        // 当前索引
  
  // 动作
  loadWords: (wordData) => {
    set({ 
      words: wordData,
      currentIndex: 0  // 加载新单词时重置索引
    });
  },
  
  setCurrentIndex: (index) => {
    const { words } = get();
    if (index >= 0 && index < words.length) {
      set({ currentIndex: index });
    }
  },
  
  nextWord: (playMode = 'sequential') => {
    const { words, currentIndex } = get();
    if (words.length === 0) return;
    
    let newIndex;
    if (playMode === 'sequential') {
      newIndex = (currentIndex + 1) % words.length;
    } else if (playMode === 'random') {
      newIndex = Math.floor(Math.random() * words.length);
    }
    
    set({ currentIndex: newIndex });
    return newIndex;
  },
  
  prevWord: (playMode = 'sequential') => {
    const { words, currentIndex } = get();
    if (words.length === 0) return;
    
    let newIndex;
    if (playMode === 'sequential') {
      newIndex = (currentIndex - 1 + words.length) % words.length;
    } else if (playMode === 'random') {
      newIndex = Math.floor(Math.random() * words.length);
    }
    
    set({ currentIndex: newIndex });
    return newIndex;
  },
  
  // 获取当前单词
  getCurrentWord: () => {
    const { words, currentIndex } = get();
    return words.length > 0 ? words[currentIndex] : null;
  },
  
  // 获取指定索引的单词
  getWordByIndex: (index) => {
    const { words } = get();
    return words[index] || null;
  },
  
  // 获取单词总数
  getWordCount: () => {
    const { words } = get();
    return words.length;
  },
  
  // 清空单词列表
  clearWords: () => {
    set({ words: [], currentIndex: 0 });
  }
}));
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 用户偏好设置 Store
 * 管理语言、声音、翻译显示等用户偏好
 * 使用 persist 中间件持久化到 localStorage
 */
export const usePreferencesStore = create(
  persist(
    (set, get) => ({
      // 状态
      selectedLanguage: 'fr-FR',  // 默认法语
      selectedVoice: '',          // 选择的声音
      showTranslation: false,     // 是否显示翻译
      
      // 动作
      setLanguage: (language) => {
        set({ selectedLanguage: language });
        // 语言改变时重置声音选择
        set({ selectedVoice: '' });
      },
      
      setVoice: (voice) => {
        set({ selectedVoice: voice });
      },
      
      toggleTranslation: () => {
        set((state) => ({ showTranslation: !state.showTranslation }));
      },
      
      setShowTranslation: (show) => {
        set({ showTranslation: show });
      },
      
      // 获取当前偏好设置
      getPreferences: () => {
        const state = get();
        return {
          language: state.selectedLanguage,
          voice: state.selectedVoice,
          showTranslation: state.showTranslation
        };
      }
    }),
    {
      name: 'read-tts-preferences', // localStorage 键名
      partialize: (state) => ({
        // 只持久化这些字段
        selectedLanguage: state.selectedLanguage,
        selectedVoice: state.selectedVoice,
        showTranslation: state.showTranslation
      })
    }
  )
);
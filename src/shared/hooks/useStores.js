import { useWordListStore } from '../../features/wordList/store';
import { useAudioStore } from '../../features/audio/store';
import { usePlaybackStore } from '../../features/playback/store';
import { usePreferencesStore } from '../../features/preferences/store';
import { useAudioGenerationStore } from '../../features/audioGeneration/store';

/**
 * 组合使用多个 Store 的便捷 Hook
 * 避免在组件中导入多个 store
 */
export const useStores = () => {
  return {
    wordList: useWordListStore(),
    audio: useAudioStore(),
    playback: usePlaybackStore(),
    preferences: usePreferencesStore(),
    audioGeneration: useAudioGenerationStore()
  };
};

/**
 * 获取当前播放状态的组合 Hook
 */
export const usePlayingStatus = () => {
  const currentIndex = useWordListStore(state => state.currentIndex);
  const audioPlaying = useAudioStore(state => state.audioPlaying);
  const playingIndex = useAudioStore(state => state.playingIndex);
  const isPlaying = usePlaybackStore(state => state.isPlaying);
  
  return {
    currentIndex,
    audioPlaying,
    playingIndex,
    isPlaying,
    isCurrentlyPlaying: audioPlaying && playingIndex === currentIndex
  };
};

/**
 * 获取当前单词和播放状态的组合 Hook
 */
export const useCurrentWord = () => {
  const currentWord = useWordListStore(state => state.getCurrentWord());
  const currentIndex = useWordListStore(state => state.currentIndex);
  const wordCount = useWordListStore(state => state.getWordCount());
  const { isCurrentlyPlaying } = usePlayingStatus();
  
  return {
    word: currentWord,
    index: currentIndex,
    total: wordCount,
    isPlaying: isCurrentlyPlaying
  };
};
import { message } from 'antd';
import { useAudioStore } from './store';
import { useWordListStore } from '../wordList/store';
import { usePlaybackStore } from '../playback/store';
import { usePreferencesStore } from '../preferences/store';

/**
 * 音频播放副作用处理器
 * 集中处理音频相关的副作用
 */
class AudioEffects {
  constructor() {
    this.audioElement = new Audio();
    this.initializeAudioEvents();
  }
  
  /**
   * 初始化音频事件监听
   */
  initializeAudioEvents() {
    // 音频播放结束事件
    this.audioElement.addEventListener('ended', this.handleAudioEnded.bind(this));
    
    // 音频错误事件
    this.audioElement.addEventListener('error', this.handleAudioError.bind(this));
  }
  
  /**
   * 播放音频
   */
  async playAudio(text, language = null, isAutoPlay = false, forcePlay = false, wordIndex = null) {
    const audioStore = useAudioStore.getState();
    const preferencesStore = usePreferencesStore.getState();
    const wordListStore = useWordListStore.getState();
    
    // 检查是否允许播放
    if (audioStore.audioPlaying && !forcePlay) {
      console.log(`当前正在播放音频，不允许播放: "${text}"`);
      return false;
    }
    
    // 使用传入的索引或当前索引
    const playIndex = wordIndex !== null ? wordIndex : wordListStore.currentIndex;
    
    // 设置播放状态
    audioStore.startPlaying(playIndex);
    
    // 标记是否为自动播放
    this.audioElement.isAutoPlay = isAutoPlay;
    
    // 使用传入的语言或用户偏好语言
    const langToUse = language || preferencesStore.selectedLanguage;
    const voice = preferencesStore.selectedVoice;
    
    try {
      // 检查缓存
      const cachedUrl = audioStore.getCachedAudio(text);
      
      if (cachedUrl) {
        console.log('使用缓存的音频:', text);
        await this.playAudioFromUrl(cachedUrl);
      } else {
        console.log('生成新音频:', text);
        const audioUrl = await this.generateAudio(text, langToUse, voice);
        audioStore.updateCache(text, audioUrl);
        await this.playAudioFromUrl(audioUrl);
      }
      
      return true;
    } catch (error) {
      console.error('播放音频失败:', error);
      message.error('播放音频失败');
      audioStore.stopPlaying();
      return false;
    }
  }
  
  /**
   * 从URL播放音频
   */
  async playAudioFromUrl(audioUrl) {
    // 停止当前播放
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    
    // 设置新的音频源
    this.audioElement.src = `http://localhost:3001${audioUrl}`;
    
    // 播放音频
    try {
      await this.audioElement.play();
    } catch (playError) {
      console.error('播放音频时出错:', playError);
      // 尝试重新加载并播放
      this.audioElement.load();
      await this.audioElement.play();
    }
  }
  
  /**
   * 生成音频
   */
  async generateAudio(text, language, voice) {
    const response = await fetch('http://localhost:3001/generate-tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language,
        voice
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.audioUrl;
    } else {
      throw new Error(data.error || '生成音频失败');
    }
  }
  
  /**
   * 处理音频播放结束
   */
  handleAudioEnded() {
    const audioStore = useAudioStore.getState();
    const playbackStore = usePlaybackStore.getState();
    const wordListStore = useWordListStore.getState();
    
    console.log('音频播放结束，isAutoPlay:', this.audioElement.isAutoPlay);
    
    // 设置播放完成状态
    audioStore.stopPlaying();
    
    // 只有在自动播放模式下才继续
    if (playbackStore.isPlaying && this.audioElement.isAutoPlay) {
      this.handleAutoPlayNext();
    }
  }
  
  /**
   * 处理自动播放下一个
   */
  handleAutoPlayNext() {
    const playbackStore = usePlaybackStore.getState();
    const wordListStore = useWordListStore.getState();
    
    // 检查是否应该重复当前单词
    if (playbackStore.shouldRepeatCurrent()) {
      console.log('继续播放当前单词');
      playbackStore.incrementPlayCount();
      
      // 设置定时器后播放
      const timer = setTimeout(() => {
        if (playbackStore.isPlaying) {
          const currentWord = wordListStore.getCurrentWord();
          if (currentWord) {
            this.playAudio(currentWord.text, null, true, true, wordListStore.currentIndex);
          }
        }
      }, playbackStore.interval * 1000);
      
      playbackStore.setTimerRef(timer);
    } else {
      console.log('移动到下一个单词');
      playbackStore.resetPlayCount();
      
      // 设置定时器后切换到下一个单词
      const timer = setTimeout(() => {
        if (playbackStore.isPlaying) {
          // 切换到下一个单词
          const newIndex = wordListStore.nextWord(playbackStore.playMode);
          
          // 播放新单词
          setTimeout(() => {
            const currentWord = wordListStore.getCurrentWord();
            if (currentWord && playbackStore.isPlaying) {
              this.playAudio(currentWord.text, null, true, true, newIndex);
            }
          }, 200);
        }
      }, playbackStore.interval * 1000);
      
      playbackStore.setTimerRef(timer);
    }
  }
  
  /**
   * 处理音频错误
   */
  handleAudioError(error) {
    console.error('音频播放错误:', error);
    message.error('音频播放失败');
    
    const audioStore = useAudioStore.getState();
    audioStore.stopPlaying();
  }
  
  /**
   * 停止播放
   */
  stopAudio() {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    
    const audioStore = useAudioStore.getState();
    const playbackStore = usePlaybackStore.getState();
    
    audioStore.stopPlaying();
    playbackStore.stopPlayback();
  }
  
  /**
   * 暂停播放
   */
  pauseAudio() {
    this.audioElement.pause();
    
    const playbackStore = usePlaybackStore.getState();
    playbackStore.pausePlayback();
  }
}

// 创建单例
export const audioEffects = new AudioEffects();
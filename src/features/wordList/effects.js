import { message, notification } from 'antd';
import { useWordListStore } from './store';
import { useAudioStore } from '../audio/store';
import { useAudioGenerationStore } from '../audioGeneration/store';
import { usePreferencesStore } from '../preferences/store';
import { usePlaybackStore } from '../playback/store';

/**
 * 文件上传和音频预生成副作用处理器
 */
export class WordListEffects {
  /**
   * 处理文件上传成功
   */
  static handleFileUploaded(data) {
    const wordListStore = useWordListStore.getState();
    
    // 加载单词数据
    wordListStore.loadWords(data);
    message.success(`成功加载 ${data.length} 个单词/短语`);
    
    // 自动开始预生成音频
    this.preGenerateAudios(data);
  }
  
  /**
   * 批量预生成音频
   */
  static async preGenerateAudios(wordsData) {
    if (!wordsData || wordsData.length === 0) return;
    
    const audioStore = useAudioStore.getState();
    const audioGenerationStore = useAudioGenerationStore.getState();
    const preferencesStore = usePreferencesStore.getState();
    
    try {
      // 开始生成
      audioGenerationStore.startGeneration(wordsData.length);
      
      // 提取所有单词文本
      const texts = wordsData.map(word => word.text);
      
      // 检查哪些单词已经有缓存
      const cachedTexts = Object.keys(audioStore.audioCache);
      const uncachedTexts = texts.filter(text => !cachedTexts.includes(text));
      
      // 如果所有单词都已缓存，直接返回
      if (uncachedTexts.length === 0) {
        notification.success({
          message: '音频预生成完成',
          description: `所有 ${texts.length} 个音频已在缓存中`,
          duration: 3,
        });
        audioGenerationStore.updateProgress(texts.length);
        audioGenerationStore.endGeneration();
        return;
      }
      
      // 调用批量生成API，只处理未缓存的单词
      const response = await fetch('http://localhost:3001/batch-generate-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: uncachedTexts,
          language: preferencesStore.selectedLanguage,
          voice: preferencesStore.selectedVoice,
          batchSize: audioGenerationStore.batchSize
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 更新进度 - 包括已有缓存的数量
        const totalCompleted = data.completed + (texts.length - uncachedTexts.length);
        audioGenerationStore.updateProgress(totalCompleted);
        
        // 将已缓存的音频添加到缓存对象
        const cacheData = {};
        data.results.forEach(result => {
          cacheData[result.text] = result.audioUrl;
        });
        audioStore.batchUpdateCache(cacheData);
        
        // 如果还有待处理的音频，显示通知
        if (data.pending > 0) {
          notification.open({
            message: '音频预生成',
            description: `已找到 ${totalCompleted} 个缓存音频，正在后台生成剩余 ${data.pending} 个音频...`,
            duration: 3,
          });
        } else {
          notification.success({
            message: '音频预生成完成',
            description: `所有 ${texts.length} 个音频已准备就绪`,
            duration: 3,
          });
          audioGenerationStore.endGeneration();
        }
      }
    } catch (error) {
      console.error('预生成音频失败:', error);
      message.error('预生成音频失败');
      audioGenerationStore.endGeneration();
    }
  }
  
  /**
   * 预加载下一批音频
   */
  static preloadNextBatch() {
    const wordListStore = useWordListStore.getState();
    const audioStore = useAudioStore.getState();
    const playbackStore = usePlaybackStore.getState();
    const preferencesStore = usePreferencesStore.getState();
    const audioGenerationStore = useAudioGenerationStore.getState();
    
    const { words, currentIndex } = wordListStore;
    const { playMode } = playbackStore;
    const { batchSize } = audioGenerationStore;
    
    if (words.length === 0) return;
    
    // 确定要预加载的单词索引
    const nextIndices = [];
    let nextIndex = currentIndex;
    
    // 根据播放模式预加载不同的单词
    for (let i = 0; i < batchSize; i++) {
      if (playMode === 'sequential') {
        nextIndex = (nextIndex + 1) % words.length;
      } else if (playMode === 'random') {
        nextIndex = Math.floor(Math.random() * words.length);
      }
      nextIndices.push(nextIndex);
    }
    
    // 提取要预加载的单词文本
    const textsToPreload = nextIndices.map(idx => words[idx].text);
    
    // 更新音频队列
    audioStore.setAudioQueue(textsToPreload);
    
    // 预加载这些单词的音频
    textsToPreload.forEach(text => {
      if (!audioStore.isAudioCached(text)) {
        // 如果缓存中没有，异步预加载
        fetch('http://localhost:3001/generate-tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            language: preferencesStore.selectedLanguage,
            voice: preferencesStore.selectedVoice
          }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // 添加到缓存
            audioStore.updateCache(text, data.audioUrl);
          }
        })
        .catch(error => {
          console.error('预加载音频失败:', error);
        });
      }
    });
  }
}
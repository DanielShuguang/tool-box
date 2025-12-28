import { usePlaybackProgressStore } from '@/stores/musicPlayer'

/**
 * 播放进度 Hook
 * 管理当前播放音乐的播放进度持久化
 */
export function usePlaybackProgress() {
  const playbackProgressStore = usePlaybackProgressStore()
  const { saveProgress, getProgress, pauseProgress, clearProgress } = playbackProgressStore

  const { currentTrackId, currentTime, isPlaying } = storeToRefs(playbackProgressStore)

  function setCurrentTrack(trackId: string | null) {
    if (trackId) {
      const progress = getProgress()
      if (progress.trackId !== trackId) {
        // 切换到不同曲目时重置播放时间
        playbackProgressStore.currentTime = 0
      }
    }
  }

  return {
    currentTrackId,
    currentTime,
    isPlaying,
    saveProgress,
    getProgress,
    setCurrentTrack,
    pauseProgress,
    clearProgress
  }
}

import { usePlaybackProgressStore } from '@/stores/musicPlayer'

/**
 * 播放进度 Hook
 * 管理单个曲目的播放进度持久化
 */
export function usePlaybackProgress() {
  const playbackProgressStore = usePlaybackProgressStore()
  const { saveProgress, getProgress, clearProgress, clearAllProgress } = playbackProgressStore

  const currentTrackId = ref<string | null>(null)
  const currentProgress = ref(0)

  function setCurrentTrack(trackId: string | null) {
    currentTrackId.value = trackId
    if (trackId) {
      currentProgress.value = getProgress(trackId)
    } else {
      currentProgress.value = 0
    }
  }

  return {
    currentTrackId,
    currentProgress,
    saveProgress,
    getProgress,
    setCurrentTrack,
    clearProgress,
    clearAllProgress
  }
}

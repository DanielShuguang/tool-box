import { usePersistentStorage } from '@/hooks/usePersistentStorage'
import { ConfigFile } from '@/utils/storage'
import { ref } from 'vue'

export function usePlaybackProgress() {
  const progressState = usePersistentStorage(
    'playback-progress',
    {} as Record<string, number>,
    ConfigFile.MusicPlayer
  )

  const currentTrackId = ref<string | null>(null)
  const currentProgress = ref(0)

  function saveProgress(trackId: string, time: number) {
    if (time > 0) {
      progressState.value[trackId] = time
    }
  }

  function getProgress(trackId: string): number {
    return progressState.value[trackId] || 0
  }

  function setCurrentTrack(trackId: string | null) {
    currentTrackId.value = trackId
    if (trackId) {
      currentProgress.value = getProgress(trackId)
    } else {
      currentProgress.value = 0
    }
  }

  function clearProgress(trackId: string) {
    delete progressState.value[trackId]
  }

  function clearAllProgress() {
    progressState.value = {}
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

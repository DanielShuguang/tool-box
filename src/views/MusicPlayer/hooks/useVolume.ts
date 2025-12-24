import { usePersistentStorage } from '@/hooks/usePersistentStorage'
import { ConfigFile } from '@/utils/storage'

/**
 * 音量控制 Hook
 * 管理音量的状态和持久化
 */
export function useVolume() {
  const playerState = usePersistentStorage(
    'player-state',
    {
      volume: 0.8,
      playMode: 'sequence',
      currentTrackId: null as string | null,
      playlist: []
    },
    ConfigFile.MusicPlayer
  )

  const volume = computed(() => playerState.value.volume)

  function setVolume(vol: number) {
    playerState.value.volume = vol
  }

  return {
    volume,
    setVolume
  }
}

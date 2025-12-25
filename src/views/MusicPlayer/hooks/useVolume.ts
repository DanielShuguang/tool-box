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

  const volume = computed({
    get: () => playerState.value.volume,
    set: (vol: number) => {
      playerState.value.volume = vol
    }
  })

  function setVolume(vol: number) {
    volume.value = vol
  }

  return {
    volume,
    setVolume
  }
}

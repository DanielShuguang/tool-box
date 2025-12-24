import { computed } from 'vue'
import { usePersistentStorage } from '@/hooks/usePersistentStorage'
import { ConfigFile } from '@/utils/storage'

export function useVolume() {
  const playerState = usePersistentStorage(
    'player-state',
    {
      volume: 0.8,
      playMode: 'sequence',
      currentIndex: 0,
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

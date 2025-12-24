import { computed } from 'vue'
import { usePersistentStorage } from '@/hooks/usePersistentStorage'
import { ConfigFile } from '@/utils/storage'

export type PlayMode = 'sequence' | 'loop' | 'random'

export interface AudioFile {
  id: string
  name: string
  path: string
  duration?: number
  artist?: string
  album?: string
  title?: string
}

export function usePlaylist() {
  const playerState = usePersistentStorage(
    'player-state',
    {
      volume: 0.8,
      playMode: 'sequence' as PlayMode,
      currentIndex: 0,
      playlist: [] as AudioFile[]
    },
    ConfigFile.MusicPlayer
  )

  const playlist = computed(() => playerState.value.playlist)
  const currentIndex = computed(() => playerState.value.currentIndex)
  const currentTrack = computed(() => playlist.value[currentIndex.value] || null)

  function updatePlaylist(newPlaylist: AudioFile[]) {
    playerState.value.playlist = newPlaylist
  }

  function updateCurrentIndex(index: number) {
    playerState.value.currentIndex = index
  }

  function addToPlaylist(files: AudioFile[]) {
    playerState.value.playlist = [...playlist.value, ...files]
  }

  function removeFromPlaylist(index: number) {
    const newPlaylist = [...playlist.value]
    newPlaylist.splice(index, 1)
    playerState.value.playlist = newPlaylist
  }

  function clearPlaylist() {
    updatePlaylist([])
    updateCurrentIndex(0)
  }

  return {
    playlist,
    currentIndex,
    currentTrack,
    updatePlaylist,
    updateCurrentIndex,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist
  }
}

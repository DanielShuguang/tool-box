import { computed } from 'vue'
import { usePersistentStorage } from '@/hooks/usePersistentStorage'
import { ConfigFile } from '@/utils/storage'

export type PlayMode = 'sequence' | 'loop' | 'random'

export type SortOption = 'default' | 'title' | 'artist' | 'album' | 'name'

export interface SortState {
  option: SortOption
  order: 'asc' | 'desc'
}

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
      playlist: [] as AudioFile[],
      sortOption: 'default' as SortOption,
      sortOrder: 'asc' as 'asc' | 'desc'
    },
    ConfigFile.MusicPlayer
  )

  const playlist = computed(() => playerState.value.playlist)
  const currentIndex = computed(() => playerState.value.currentIndex)
  const currentTrack = computed(() => playlist.value[currentIndex.value] || null)
  const sortOption = computed(() => playerState.value.sortOption)
  const sortOrder = computed(() => playerState.value.sortOrder)

  const sortedPlaylist = computed(() => {
    const originalPlaylist = playerState.value.playlist
    const option = playerState.value.sortOption
    const order = playerState.value.sortOrder

    if (option === 'default') {
      return originalPlaylist
    }

    return [...originalPlaylist].sort((a, b) => {
      let aValue: string, bValue: string

      switch (option) {
        case 'title':
          aValue = (a.title || a.name).toLowerCase()
          bValue = (b.title || b.name).toLowerCase()
          break
        case 'artist':
          aValue = (a.artist || '').toLowerCase()
          bValue = (b.artist || '').toLowerCase()
          break
        case 'album':
          aValue = (a.album || '').toLowerCase()
          bValue = (b.album || '').toLowerCase()
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue === bValue) {
        return 0
      }

      if (order === 'asc') {
        return aValue < bValue ? -1 : 1
      } else {
        return aValue > bValue ? -1 : 1
      }
    })
  })

  function updatePlaylist(newPlaylist: AudioFile[]) {
    playerState.value.playlist = newPlaylist
  }

  function updateCurrentIndex(index: number) {
    playerState.value.currentIndex = index
  }

  function setSortOption(option: SortOption) {
    if (playerState.value.sortOption === option) {
      playerState.value.sortOrder = playerState.value.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      playerState.value.sortOption = option
      playerState.value.sortOrder = 'asc'
    }
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
    sortedPlaylist,
    currentIndex,
    currentTrack,
    sortOption,
    sortOrder,
    updatePlaylist,
    updateCurrentIndex,
    setSortOption,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist
  }
}

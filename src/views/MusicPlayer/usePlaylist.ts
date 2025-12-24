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

function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  let textIndex = 0
  for (const char of lowerQuery) {
    const foundIndex = lowerText.indexOf(char, textIndex)
    if (foundIndex === -1) return false
    textIndex = foundIndex + 1
  }
  return true
}

function matchAudioFile(file: AudioFile, query: string): boolean {
  if (!query.trim()) return true

  const searchFields = [file.name, file.title || '', file.artist || '', file.album || '']
    .filter(Boolean)
    .join(' ')

  return fuzzyMatch(searchFields, query)
}

export function usePlaylist() {
  const playerState = usePersistentStorage(
    'player-state',
    {
      volume: 0.8,
      playMode: 'sequence' as PlayMode,
      currentTrackId: null as string | null,
      playlist: [] as AudioFile[],
      sortOption: 'default' as SortOption,
      sortOrder: 'asc' as 'asc' | 'desc'
    },
    ConfigFile.MusicPlayer
  )

  const playlist = computed(() => playerState.value.playlist)
  const currentTrackId = computed(() => playerState.value.currentTrackId)
  const currentTrack = computed(() => {
    const id = playerState.value.currentTrackId
    return playlist.value.find(t => t.id === id) || null
  })
  const sortOption = computed(() => playerState.value.sortOption)
  const sortOrder = computed(() => playerState.value.sortOrder)
  const searchQuery = ref('')

  const filteredPlaylist = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()

    if (!query) {
      return sortedPlaylist.value
    }

    return sortedPlaylist.value.filter(item => matchAudioFile(item, query))
  })

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

  function updateCurrentTrackId(trackId: string | null) {
    playerState.value.currentTrackId = trackId
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
    updateCurrentTrackId(null)
  }

  return {
    playlist,
    sortedPlaylist,
    filteredPlaylist,
    currentTrack,
    currentTrackId,
    sortOption,
    sortOrder,
    searchQuery,
    updatePlaylist,
    updateCurrentTrackId,
    setSortOption,
    setSearchQuery: (value: string) => {
      searchQuery.value = value
    },
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist
  }
}

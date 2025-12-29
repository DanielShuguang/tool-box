import {
  useMusicPlayerStore,
  type PlayMode,
  type SortOption,
  type AudioFile,
  usePlaybackProgressStore
} from '@/stores/musicPlayer'
import Fuse, { IFuseOptions } from 'fuse.js'

// 重新导出类型以保持向后兼容
export type { PlayMode, SortOption, AudioFile }

/**
 * 排序状态
 */
export interface SortState {
  option: SortOption
  order: 'asc' | 'desc'
}

export function usePlaylist() {
  const musicPlayerStore = useMusicPlayerStore()
  const { playlist, sortOption, sortOrder, currentTrack } = storeToRefs(musicPlayerStore)
  const {
    setSortOption: storeSetSortOption,
    addToPlaylist: storeAddToPlaylist,
    removeFromPlaylist: storeRemoveFromPlaylist,
    clearPlaylist: storeClearPlaylist,
    updatePlaylist: storeUpdatePlaylist
  } = musicPlayerStore
  const progressStore = usePlaybackProgressStore()
  const { currentTrackId } = storeToRefs(progressStore)

  const searchQuery = ref('')
  const searchQueryDbs = refDebounced(searchQuery, 500)

  const fuseOptions: IFuseOptions<AudioFile> = {
    keys: ['name', 'title', 'artist', 'album'],
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: false
  }

  const fuseInstance = computed(() => {
    return new Fuse(sortedPlaylist.value, fuseOptions)
  })

  const filteredPlaylist = computed(() => {
    const query = searchQueryDbs.value.trim()

    if (!query) {
      return sortedPlaylist.value
    }

    return fuseInstance.value.search(query).map(result => result.item)
  })

  const sortedPlaylist = computed(() => {
    const originalPlaylist = playlist.value
    const option = sortOption.value
    const order = sortOrder.value

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
    storeUpdatePlaylist(newPlaylist)
  }

  function updateCurrentTrackId(trackId: string | null) {
    currentTrackId.value = trackId
  }

  function setSortOption(option: SortOption) {
    storeSetSortOption(option)
  }

  function addToPlaylist(files: AudioFile[]) {
    storeAddToPlaylist(files)
  }

  function removeFromPlaylist(index: number) {
    storeRemoveFromPlaylist(index)
  }

  function clearPlaylist() {
    storeClearPlaylist()
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

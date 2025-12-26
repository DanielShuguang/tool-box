import {
  useMusicPlayerStore,
  type PlayMode,
  type SortOption,
  type AudioFile
} from '@/stores/musicPlayer'

// 重新导出类型以保持向后兼容
export type { PlayMode, SortOption, AudioFile }

/**
 * 排序状态
 */
export interface SortState {
  option: SortOption
  order: 'asc' | 'desc'
}

/**
 * 模糊匹配算法
 * 检查文本中是否包含查询字符串的所有字符（按顺序）
 * @param text 被搜索的文本
 * @param query 查询字符串
 * @returns 是否匹配
 */
function fuzzyMatch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase())
}

function matchAudioFile(file: AudioFile, query: string): boolean {
  if (!query.trim()) return true

  const searchFields = [file.name, file.title || '', file.artist || '', file.album || '']
    .filter(Boolean)
    .join(' ')

  return fuzzyMatch(searchFields, query)
}

export function usePlaylist() {
  const musicPlayerStore = useMusicPlayerStore()
  const { playlist, sortOption, sortOrder, currentTrackId, currentTrack } =
    storeToRefs(musicPlayerStore)
  const {
    setSortOption: storeSetSortOption,
    addToPlaylist: storeAddToPlaylist,
    removeFromPlaylist: storeRemoveFromPlaylist,
    clearPlaylist: storeClearPlaylist,
    updatePlaylist: storeUpdatePlaylist
  } = musicPlayerStore

  const searchQuery = ref('')
  const searchQueryDbs = refDebounced(searchQuery, 500)
  const filteredPlaylist = computed(() => {
    const query = searchQueryDbs.value.trim().toLowerCase()

    if (!query) {
      return sortedPlaylist.value
    }

    return sortedPlaylist.value.filter(item => matchAudioFile(item, query))
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
    musicPlayerStore.currentTrackId = trackId
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

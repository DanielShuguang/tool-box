import { usePersistentStorage } from '@/hooks/usePersistentStorage'
import { ConfigFile } from '@/utils/storage'

/**
 * 播放模式类型
 * - sequence: 顺序播放
 * - loop: 列表循环
 * - single: 单曲循环
 * - random: 随机播放
 */
export type PlayMode = 'sequence' | 'loop' | 'single' | 'random'

/**
 * 排序选项类型
 * - default: 默认排序（保持原始顺序）
 * - title: 按标题排序
 * - artist: 按艺术家排序
 * - album: 按专辑排序
 * - name: 按文件名排序
 */
export type SortOption = 'default' | 'title' | 'artist' | 'album' | 'name'

/**
 * 排序状态
 */
export interface SortState {
  option: SortOption
  order: 'asc' | 'desc'
}

/**
 * 音频文件信息
 */
export interface AudioFile {
  /** 唯一标识符 */
  id: string
  /** 文件名 */
  name: string
  /** 文件路径 */
  path: string
  /** 音频时长（秒） */
  duration?: number
  /** 艺术家名称 */
  artist?: string
  /** 专辑名称 */
  album?: string
  /** 标题 */
  title?: string
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

  const { playlist, sortOption, sortOrder, currentTrackId } = toRefs(playerState.value)
  const currentTrack = computed(() => {
    const id = currentTrackId.value
    return playlist.value.find(t => t.id === id) || null
  })
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

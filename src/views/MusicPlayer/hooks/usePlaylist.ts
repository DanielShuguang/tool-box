import {
  useMusicPlayerStore,
  type PlayMode,
  type SortOption,
  type AudioFile,
  type Playlist,
  usePlaybackProgressStore
} from '@/stores/musicPlayer'
import Fuse, { IFuseOptions } from 'fuse.js'

// 重新导出类型以保持向后兼容
export type { PlayMode, SortOption, AudioFile, Playlist }

/**
 * 排序状态
 */
export interface SortState {
  option: SortOption
  order: 'asc' | 'desc'
}

export function usePlaylist() {
  const musicPlayerStore = useMusicPlayerStore()
  const {
    playlist,
    playlists,
    currentPlaylistId,
    currentPlaylist,
    sortOption,
    sortOrder,
    currentTrack
  } = storeToRefs(musicPlayerStore)
  const {
    setSortOption: storeSetSortOption,
    addToPlaylist: storeAddToPlaylist,
    removeFromPlaylist: storeRemoveFromPlaylist,
    clearPlaylist: storeClearPlaylist,
    updatePlaylist: storeUpdatePlaylist,
    createPlaylist: storeCreatePlaylist,
    deletePlaylist: storeDeletePlaylist,
    renamePlaylist: storeRenamePlaylist,
    switchPlaylist: storeSwitchPlaylist
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

  /**
   * 创建新播放列表
   */
  function createPlaylist(name: string): string {
    return storeCreatePlaylist(name)
  }

  /**
   * 删除播放列表
   */
  function deletePlaylist(playlistId: string): boolean {
    return storeDeletePlaylist(playlistId)
  }

  /**
   * 重命名播放列表
   */
  function renamePlaylist(playlistId: string, newName: string): boolean {
    return storeRenamePlaylist(playlistId, newName)
  }

  /**
   * 切换播放列表
   */
  function switchPlaylist(playlistId: string): boolean {
    // 切换播放列表时重置搜索
    searchQuery.value = ''
    return storeSwitchPlaylist(playlistId)
  }

  return {
    playlist,
    playlists,
    currentPlaylistId,
    currentPlaylist,
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
    clearPlaylist,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    switchPlaylist
  }
}

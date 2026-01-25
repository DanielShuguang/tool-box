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
 * 播放列表信息
 */
export interface Playlist {
  /** 播放列表唯一标识符 */
  id: string
  /** 播放列表名称 */
  name: string
  /** 音频文件列表 */
  tracks: AudioFile[]
  /** 排序选项 */
  sortOption: SortOption
  /** 排序顺序 */
  sortOrder: 'asc' | 'desc'
  /** 是否为默认播放列表 */
  isDefault: boolean
}

export interface MusicPlayerState {
  volume: number
  playMode: PlayMode
  playlists: Playlist[]
  currentPlaylistId: string | null
  sortOption: SortOption
  sortOrder: 'asc' | 'desc'
}

/**
 * 生成唯一播放列表 ID
 */
function generatePlaylistId(): string {
  return `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const useMusicPlayerStore = defineStore(
  'musicPlayer',
  () => {
    const volume = ref(0.8)
    const playMode = ref<PlayMode>('sequence')
    const playlists = ref<Playlist[]>([])
    const currentPlaylistId = ref<string | null>(null)
    const sortOption = ref<SortOption>('default')
    const sortOrder = ref<'asc' | 'desc'>('asc')

    const progressStore = usePlaybackProgressStore()
    const { clearProgress } = progressStore
    const { currentTrackId } = storeToRefs(progressStore)

    /**
     * 初始化默认播放列表
     * 同时处理从旧版本数据结构的迁移
     */
    function initializeDefaultPlaylist() {
      // 检查是否已有默认播放列表
      const hasDefault = playlists.value.some(p => p.isDefault)
      if (!hasDefault) {
        const defaultPlaylist: Playlist = {
          id: generatePlaylistId(),
          name: '默认播放列表',
          tracks: [],
          sortOption: 'default',
          sortOrder: 'asc',
          isDefault: true
        }
        playlists.value = [defaultPlaylist]
        currentPlaylistId.value = defaultPlaylist.id
      } else if (!currentPlaylistId.value) {
        // 如果有默认播放列表但没有选中，则选中默认播放列表
        const defaultPlaylist = playlists.value.find(p => p.isDefault)
        if (defaultPlaylist) {
          currentPlaylistId.value = defaultPlaylist.id
        }
      }
    }

    /**
     * 获取当前播放列表
     */
    const currentPlaylist = computed(() => {
      if (!currentPlaylistId.value) {
        return null
      }
      return playlists.value.find(p => p.id === currentPlaylistId.value) || null
    })

    /**
     * 获取当前播放列表的音频文件列表（向后兼容）
     */
    const playlist = computed(() => {
      return currentPlaylist.value?.tracks || []
    })

    /**
     * 获取当前播放列表的排序选项（向后兼容）
     */
    const currentSortOption = computed(() => {
      return currentPlaylist.value?.sortOption || sortOption.value
    })

    /**
     * 获取当前播放列表的排序顺序（向后兼容）
     */
    const currentSortOrder = computed(() => {
      return currentPlaylist.value?.sortOrder || sortOrder.value
    })

    // 播放模式控制
    function togglePlayMode() {
      const modes: PlayMode[] = ['sequence', 'loop', 'single', 'random']
      const currentModeIndex = modes.indexOf(playMode.value)
      const newMode = modes[(currentModeIndex + 1) % modes.length]
      playMode.value = newMode
    }

    // 播放列表管理
    function addToPlaylist(files: AudioFile[]) {
      const playlist = currentPlaylist.value
      if (playlist) {
        playlist.tracks = [...playlist.tracks, ...files]
      }
    }

    function removeFromPlaylist(index: number) {
      const playlist = currentPlaylist.value
      if (playlist) {
        const newTracks = [...playlist.tracks]
        newTracks.splice(index, 1)
        playlist.tracks = newTracks
      }
    }

    function clearPlaylist() {
      const playlist = currentPlaylist.value
      if (playlist) {
        playlist.tracks = []
        clearProgress()
      }
    }

    function updatePlaylist(newPlaylist: AudioFile[]) {
      const playlist = currentPlaylist.value
      if (playlist) {
        playlist.tracks = newPlaylist
      }
    }

    // 排序控制
    function setSortOption(option: SortOption) {
      const playlist = currentPlaylist.value
      if (playlist) {
        if (playlist.sortOption === option) {
          playlist.sortOrder = playlist.sortOrder === 'asc' ? 'desc' : 'asc'
        } else {
          playlist.sortOption = option
          playlist.sortOrder = 'asc'
        }
      } else {
        // 向后兼容：如果没有当前播放列表，更新全局排序选项
        if (sortOption.value === option) {
          sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
        } else {
          sortOption.value = option
          sortOrder.value = 'asc'
        }
      }
    }

    /**
     * 创建新播放列表
     */
    function createPlaylist(name: string): string {
      const newPlaylist: Playlist = {
        id: generatePlaylistId(),
        name,
        tracks: [],
        sortOption: 'default',
        sortOrder: 'asc',
        isDefault: false
      }
      playlists.value.push(newPlaylist)
      currentPlaylistId.value = newPlaylist.id
      return newPlaylist.id
    }

    /**
     * 删除播放列表
     */
    function deletePlaylist(playlistId: string): boolean {
      const playlist = playlists.value.find(p => p.id === playlistId)
      if (!playlist || playlist.isDefault) {
        return false
      }

      const index = playlists.value.findIndex(p => p.id === playlistId)
      if (index !== -1) {
        playlists.value.splice(index, 1)

        // 如果删除的是当前播放列表，切换到默认播放列表
        if (currentPlaylistId.value === playlistId) {
          const defaultPlaylist = playlists.value.find(p => p.isDefault)
          currentPlaylistId.value = defaultPlaylist?.id || null
        }
        return true
      }
      return false
    }

    /**
     * 将歌曲添加到指定播放列表
     * @param files 要添加的音频文件列表
     * @param playlistId 目标播放列表ID
     */
    function addToSpecificPlaylist(files: AudioFile[], playlistId: string) {
      const targetPlaylist = playlists.value.find(p => p.id === playlistId)
      if (targetPlaylist) {
        // 过滤掉已经在目标播放列表中存在的歌曲（避免重复添加）
        const existingIds = new Set(targetPlaylist.tracks.map(t => t.id))
        const newFiles = files.filter(f => !existingIds.has(f.id))
        targetPlaylist.tracks = [...targetPlaylist.tracks, ...newFiles]
      }
    }

    /**
     * 重命名播放列表
     */
    function renamePlaylist(playlistId: string, newName: string): boolean {
      const playlist = playlists.value.find(p => p.id === playlistId)
      if (!playlist || playlist.isDefault) {
        return false
      }
      playlist.name = newName
      return true
    }

    /**
     * 切换播放列表
     */
    function switchPlaylist(playlistId: string): boolean {
      const playlist = playlists.value.find(p => p.id === playlistId)
      if (playlist) {
        currentPlaylistId.value = playlistId
        return true
      }
      return false
    }

    // 计算属性
    const currentTrack = computed(() => {
      const id = currentTrackId.value
      if (!id) {
        return null
      }
      // 从所有播放列表中查找当前播放的音乐
      // 这样即使切换播放列表，如果音乐仍在播放，也能正确显示
      for (const playlist of playlists.value) {
        const track = playlist.tracks.find(t => t.id === id)
        if (track) {
          return track
        }
      }
      return null
    })

    // 初始化
    initializeDefaultPlaylist()

    return {
      // 状态
      volume,
      playMode,
      playlists,
      currentPlaylistId,
      playlist, // 向后兼容
      sortOption: currentSortOption, // 向后兼容
      sortOrder: currentSortOrder, // 向后兼容
      // 计算属性
      currentPlaylist,
      currentTrack,
      // 方法
      togglePlayMode,
      addToPlaylist,
      removeFromPlaylist,
      clearPlaylist,
      updatePlaylist,
      setSortOption,
      createPlaylist,
      deletePlaylist,
      renamePlaylist,
      switchPlaylist,
      addToSpecificPlaylist,
      initializeDefaultPlaylist
    }
  },
  {
    persist: {
      fileName: ConfigFile.MusicPlayer,
      key: 'player-state',
      keys: ['volume', 'playMode', 'playlists', 'currentPlaylistId', 'sortOption', 'sortOrder']
    }
  }
)

export interface PlaybackProgressState {
  /** 当前播放音乐的 ID */
  currentTrackId: string | null
  /** 当前播放时间（秒） */
  currentTime: number
  /** 是否正在播放 */
  isPlaying: boolean
}

// 播放进度单独持久化
export const usePlaybackProgressStore = defineStore(
  'playbackProgress',
  () => {
    const currentTrackId = ref<string | null>(null)
    const currentTime = ref(0)
    const isPlaying = ref(false)

    function saveProgress(trackId: string, time: number) {
      currentTrackId.value = trackId
      currentTime.value = time
      isPlaying.value = true
    }

    function getProgress(): { trackId: string | null; time: number } {
      return {
        trackId: currentTrackId.value,
        time: currentTime.value
      }
    }

    function pauseProgress() {
      isPlaying.value = false
    }

    function clearProgress() {
      currentTrackId.value = null
      currentTime.value = 0
      isPlaying.value = false
    }

    return {
      currentTrackId,
      currentTime,
      isPlaying,
      saveProgress,
      getProgress,
      pauseProgress,
      clearProgress
    }
  },
  {
    persist: {
      fileName: ConfigFile.MusicPlayer,
      key: 'playback-progress',
      keys: ['currentTrackId', 'currentTime', 'isPlaying']
    }
  }
)

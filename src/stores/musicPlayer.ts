import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
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

export interface MusicPlayerState {
  volume: number
  playMode: PlayMode
  currentTrackId: string | null
  playlist: AudioFile[]
  sortOption: SortOption
  sortOrder: 'asc' | 'desc'
}

export const useMusicPlayerStore = defineStore(
  'musicPlayer',
  () => {
    const volume = ref(0.8)
    const playMode = ref<PlayMode>('sequence')
    const currentTrackId = ref<string | null>(null)
    const playlist = ref<AudioFile[]>([])
    const sortOption = ref<SortOption>('default')
    const sortOrder = ref<'asc' | 'desc'>('asc')

    // 播放模式控制
    function togglePlayMode() {
      const modes: PlayMode[] = ['sequence', 'loop', 'single', 'random']
      const currentModeIndex = modes.indexOf(playMode.value)
      const newMode = modes[(currentModeIndex + 1) % modes.length]
      playMode.value = newMode
    }

    // 播放列表管理
    function addToPlaylist(files: AudioFile[]) {
      playlist.value = [...playlist.value, ...files]
    }

    function removeFromPlaylist(index: number) {
      const newPlaylist = [...playlist.value]
      newPlaylist.splice(index, 1)
      playlist.value = newPlaylist
    }

    function clearPlaylist() {
      playlist.value = []
      currentTrackId.value = null
    }

    function updatePlaylist(newPlaylist: AudioFile[]) {
      playlist.value = newPlaylist
    }

    // 排序控制
    function setSortOption(option: SortOption) {
      if (sortOption.value === option) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortOption.value = option
        sortOrder.value = 'asc'
      }
    }

    // 计算属性
    const currentTrack = computed(() => {
      const id = currentTrackId.value
      return playlist.value.find(t => t.id === id) || null
    })

    return {
      // 状态
      volume,
      playMode,
      currentTrackId,
      playlist,
      sortOption,
      sortOrder,
      // 计算属性
      currentTrack,
      // 方法
      togglePlayMode,
      addToPlaylist,
      removeFromPlaylist,
      clearPlaylist,
      updatePlaylist,
      setSortOption
    }
  },
  {
    persist: {
      fileName: ConfigFile.MusicPlayer,
      key: 'player-state',
      keys: ['volume', 'playMode', 'currentTrackId', 'playlist', 'sortOption', 'sortOrder']
    }
  }
)

// 播放进度单独持久化
export const usePlaybackProgressStore = defineStore(
  'playbackProgress',
  () => {
    const playbackProgress = ref<Record<string, number>>({})

    function saveProgress(trackId: string, time: number) {
      if (time > 0) {
        playbackProgress.value[trackId] = time
      }
    }

    function getProgress(trackId: string): number {
      return playbackProgress.value[trackId] || 0
    }

    function clearProgress(trackId: string) {
      delete playbackProgress.value[trackId]
    }

    function clearAllProgress() {
      playbackProgress.value = {}
    }

    return {
      playbackProgress,
      saveProgress,
      getProgress,
      clearProgress,
      clearAllProgress
    }
  },
  {
    persist: {
      fileName: ConfigFile.MusicPlayer,
      key: 'playback-progress'
    }
  }
)

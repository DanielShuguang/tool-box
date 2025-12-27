import { ref, computed, onMounted } from 'vue'
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

    /**
     * 数据迁移：从旧版本的多音乐进度存储迁移到新的单音乐进度存储
     */
    function migrateFromOldFormat() {
      // 检查是否存在旧版本数据
      const storedData = localStorage.getItem(`pinia-playbackProgress`)

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)

          // 检查是否是旧版本格式（playbackProgress 字段）
          if (parsedData.state && parsedData.state.playbackProgress) {
            const oldProgress = parsedData.state.playbackProgress as Record<string, number>
            const trackIds = Object.keys(oldProgress)

            if (trackIds.length > 0) {
              // 找到最近播放的音乐（进度最大的那个）
              let latestTrackId = trackIds[0]
              let latestTime = oldProgress[latestTrackId] || 0

              for (const trackId of trackIds) {
                const time = oldProgress[trackId] || 0
                if (time > latestTime) {
                  latestTime = time
                  latestTrackId = trackId
                }
              }

              // 迁移到新的格式
              currentTrackId.value = latestTrackId
              currentTime.value = latestTime
              isPlaying.value = false
            }

            // 清除旧版本数据
            delete parsedData.state.playbackProgress
            localStorage.setItem(`pinia-playbackProgress`, JSON.stringify(parsedData))
          }
        } catch (err) {
          console.error('数据迁移失败:', err)
        }
      }
    }

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

    // 在 store 初始化时执行数据迁移
    onMounted(() => {
      migrateFromOldFormat()
    })

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

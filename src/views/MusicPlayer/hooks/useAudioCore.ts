import { readAudioFile } from '@/backend-channel/music-player'
import type { AudioFile } from './usePlaylist'
import { throttle } from 'lodash-es'
import { watch } from 'vue'
import { useVolume } from './useVolume'

interface PreloadedTrack {
  track: AudioFile
  blobUrl: string
}

/**
 * 音频核心控制 Hook
 * 封装 HTML5 Audio 元素，提供音频播放、暂停、进度控制等功能
 */
export function useAudioCore() {
  const message = useMessage()

  const { volume, setVolume: setPersistedVolume } = useVolume()

  const audio = ref<HTMLAudioElement | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const isLoading = ref(false)
  const isPreloading = ref(false)

  let onTrackEndedCallback: (() => void) | null = null
  let onNearEndCallback: (() => void) | null = null
  const NEAR_END_THRESHOLD = 10 // 距离结尾10秒时触发预加载

  let currentBlobUrl: string | null = null
  let currentTrackPath: string | null = null
  let preloadedTrack: PreloadedTrack | null = null

  /**
   * 初始化音频对象
   * 创建 Audio 元素并绑定事件监听器
   */
  function initAudio() {
    audio.value = new Audio()
    audio.value.volume = volume.value

    audio.value.addEventListener(
      'timeupdate',
      throttle(() => {
        if (audio.value) {
          currentTime.value = audio.value.currentTime
          const remainingTime = (audio.value.duration || 0) - currentTime.value
          if (remainingTime > 0 && remainingTime <= NEAR_END_THRESHOLD && onNearEndCallback) {
            onNearEndCallback()
            onNearEndCallback = null
          }
        }
      }, 1000)
    )

    audio.value.addEventListener('loadedmetadata', () => {
      if (audio.value) {
        duration.value = audio.value.duration
      }
    })

    audio.value.addEventListener('ended', () => {
      if (onTrackEndedCallback) {
        onTrackEndedCallback()
      }
    })

    audio.value.addEventListener('error', () => {
      const error = audio.value?.error
      if (error && currentTrackPath) {
        console.error('Audio error:', error)
        message.error('音频播放失败，将自动跳过')
      }
    })
  }

  /**
   * 设置音量
   * @param vol 音量值（0-100）
   */
  function setVolume(vol: number) {
    const clampedVol = Math.max(0, Math.min(100, Math.round(vol))) / 100
    if (audio.value) {
      audio.value.volume = clampedVol
    }
    setPersistedVolume(clampedVol)
  }

  /**
   * 根据文件扩展名获取 MIME 类型
   * @param filePath 文件路径
   * @returns MIME 类型字符串
   */
  function getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || ''
    const mimeTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      m4a: 'audio/mp4',
      ogg: 'audio/ogg',
      aac: 'audio/aac'
    }
    return mimeTypes[ext] || 'audio/mpeg'
  }

  /**
   * 播放指定音轨
   * 优先使用预加载的音轨，如果未预加载则加载新音轨
   * @param track 音频文件信息
   */
  async function playTrack(track: AudioFile) {
    if (!audio.value || isLoading.value) return

    if (currentTrackPath === track.path) {
      if (!isPlaying.value) {
        await audio.value.play()
        isPlaying.value = true
      }
      return
    }

    isLoading.value = true

    try {
      // 尝试使用预加载的音轨
      if (await applyPreloadedTrack(track)) {
        await audio.value.play()
        isPlaying.value = true
      } else {
        // 没有预加载音轨，正常加载
        if (currentBlobUrl) {
          URL.revokeObjectURL(currentBlobUrl)
          currentBlobUrl = null
        }

        const audioData = await readAudioFile({ filePath: track.path })

        const mimeType = getMimeType(track.path)
        const blob = new Blob([audioData], { type: mimeType })
        currentBlobUrl = URL.createObjectURL(blob)

        audio.value.src = currentBlobUrl
        await audio.value.play()
        isPlaying.value = true
      }
    } catch (err) {
      message.error('音频加载失败')
      console.error('Audio load error:', err)
      currentTrackPath = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 预加载指定音轨到内存
   * 提前加载音频数据到内存，但不设置到 Audio 元素
   * @param track 音频文件信息
   */
  async function preloadTrack(track: AudioFile): Promise<void> {
    if (!track) return
    if (isPreloading.value) return
    if (currentTrackPath === track.path) return
    if (preloadedTrack?.track.path === track.path) return

    try {
      isPreloading.value = true

      // 清理之前的预加载音轨
      if (preloadedTrack) {
        URL.revokeObjectURL(preloadedTrack.blobUrl)
        preloadedTrack = null
      }

      const audioData = await readAudioFile({ filePath: track.path })
      const mimeType = getMimeType(track.path)
      const blob = new Blob([audioData], { type: mimeType })
      const blobUrl = URL.createObjectURL(blob)

      preloadedTrack = { track, blobUrl }
    } catch (err) {
      console.error('Audio preload error:', err)
      preloadedTrack = null
    } finally {
      isPreloading.value = false
    }
  }

  /**
   * 获取预加载的音轨并应用到 Audio 元素
   * @param track 音频文件信息
   */
  async function applyPreloadedTrack(track: AudioFile): Promise<boolean> {
    if (!preloadedTrack || preloadedTrack.track.path !== track.path) {
      return false
    }

    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl)
    }

    currentBlobUrl = preloadedTrack.blobUrl
    currentTrackPath = track.path
    if (audio.value) {
      audio.value.src = currentBlobUrl
      // 等待音频源设置完成
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('音频源设置超时'))
        }, 3000)

        function onCanPlay() {
          clearTimeout(timeout)
          audio.value?.removeEventListener('canplay', onCanPlay)
          audio.value?.removeEventListener('error', onError)
          resolve()
        }

        function onError() {
          clearTimeout(timeout)
          audio.value?.removeEventListener('canplay', onCanPlay)
          audio.value?.removeEventListener('error', onError)
          reject(new Error('音频加载失败'))
        }

        audio.value?.addEventListener('canplay', onCanPlay, { once: true })
        audio.value?.addEventListener('error', onError, { once: true })
      })
    }
    preloadedTrack = null

    return true
  }

  /**
   * 切换播放/暂停状态
   */
  function togglePlay() {
    if (!audio.value) return

    if (isPlaying.value) {
      audio.value.pause()
      isPlaying.value = false
    } else {
      audio.value.play()
      isPlaying.value = true
    }
  }

  /**
   * 跳转到指定时间
   * @param time 目标时间（秒）
   */
  function seekTo(time: number) {
    if (audio.value) {
      audio.value.currentTime = time
      currentTime.value = time
    }
  }

  /**
   * 停止播放
   * 释放资源，重置状态
   */
  function stop() {
    if (audio.value) {
      audio.value.pause()
      audio.value.src = ''
    }
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl)
      currentBlobUrl = null
    }
    currentTrackPath = null
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
  }

  /**
   * 注册曲目结束回调
   * @param callback 回调函数
   */
  function onTrackEnded(callback: () => void) {
    onTrackEndedCallback = callback
  }

  function onNearEnd(callback: () => void) {
    onNearEndCallback = callback
  }

  function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '00:00'

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  onMounted(() => {
    initAudio()
  })

  // 监听音量变化，确保 Audio 元素的音量与持久化存储中的值同步
  watch(volume, newVolume => {
    if (audio.value) {
      audio.value.volume = newVolume
    }
  })

  onUnmounted(() => {
    stop()
  })

  return {
    audio,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    isPreloading,
    volume,
    setVolume,
    playTrack,
    preloadTrack,
    applyPreloadedTrack,
    togglePlay,
    seekTo,
    stop,
    onTrackEnded,
    onNearEnd,
    formatTime
  }
}

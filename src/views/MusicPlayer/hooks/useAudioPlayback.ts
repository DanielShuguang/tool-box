import { readAudioFile } from '@/backend-channel/music-player'
import type { AudioFile } from './usePlaylist'
import { useVolume } from './useVolume'
import { getMimeType } from './useAudioFormat'
import { useAudioEvents } from './useAudioEvents'

/**
 * 音频播放控制 Hook
 * 提供音频元素的初始化和核心播放控制功能
 */
export function useAudioPlayback() {
  const message = useMessage()

  const { volume, setVolume: setPersistedVolume } = useVolume()
  const { bindAudioEvents, onTrackEnded, onNearEnd } = useAudioEvents()

  const audio = ref<HTMLAudioElement | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const isLoading = ref(false)

  let currentBlobUrl: string | null = null
  let currentTrackPath: string | null = null

  /**
   * 初始化音频对象
   * 创建 Audio 元素并绑定事件监听器
   */
  function initAudio() {
    audio.value = new Audio()
    audio.value.volume = volume.value

    if (audio.value) {
      bindAudioEvents(audio.value, currentTime, duration)
    }
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
   * 播放指定音轨
   * 加载音频文件并开始播放
   * @param track 音频文件信息
   */
  async function playTrack(track: AudioFile) {
    if (!audio.value || isLoading.value) return

    // 如果是当前播放的音轨，直接切换播放状态
    if (currentTrackPath === track.path) {
      if (!isPlaying.value) {
        await audio.value.play()
        isPlaying.value = true
      }
      return
    }

    isLoading.value = true

    try {
      // 清理之前的音频资源
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl)
        currentBlobUrl = null
      }

      // 加载音频数据
      const audioData = await readAudioFile({ filePath: track.path })
      const mimeType = getMimeType(track.path)
      const blob = new Blob([audioData], { type: mimeType })
      currentBlobUrl = URL.createObjectURL(blob)

      // 设置音频源并播放
      audio.value.src = currentBlobUrl
      await audio.value.play()
      isPlaying.value = true
      currentTrackPath = track.path
    } catch (err) {
      message.error('音频加载失败')
      console.error('Audio load error:', err)
      currentTrackPath = null
    } finally {
      isLoading.value = false
    }
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

  return {
    audio,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    volume,
    setVolume,
    playTrack,
    togglePlay,
    seekTo,
    stop,
    onTrackEnded,
    onNearEnd,
    initAudio
  }
}

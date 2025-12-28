import { readAudioFile } from '@/backend-channel/music-player'
import type { AudioFile } from './usePlaylist'
import { getMimeType } from './useAudioFormat'

/**
 * 预加载音轨接口
 */
export interface PreloadedTrack {
  track: AudioFile
  blobUrl: string
}

/**
 * 音频预加载 Hook
 * 提供音频文件的预加载和缓存管理功能
 */
export function useAudioPreload() {
  const isPreloading = ref(false)
  let preloadedTrack: PreloadedTrack | null = null

  /**
   * 预加载指定音轨到内存
   * 提前加载音频数据到内存，但不设置到 Audio 元素
   * @param track 音频文件信息
   */
  async function preloadTrack(track: AudioFile): Promise<void> {
    if (!track) return
    if (isPreloading.value) return
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
   * @param audio Audio 元素引用
   */
  async function applyPreloadedTrack(
    track: AudioFile,
    audio: HTMLAudioElement | null
  ): Promise<boolean> {
    if (!preloadedTrack || preloadedTrack.track.path !== track.path) {
      return false
    }

    if (!audio) {
      return false
    }

    try {
      audio.src = preloadedTrack.blobUrl

      // 等待音频源设置完成
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('音频源设置超时'))
        }, 3000)

        function onCanPlay() {
          clearTimeout(timeout)
          audio?.removeEventListener('canplay', onCanPlay)
          audio?.removeEventListener('error', onError)
          resolve()
        }

        function onError() {
          clearTimeout(timeout)
          audio?.removeEventListener('canplay', onCanPlay)
          audio?.removeEventListener('error', onError)
          reject(new Error('音频加载失败'))
        }

        audio?.addEventListener('canplay', onCanPlay, { once: true })
        audio?.addEventListener('error', onError, { once: true })
      })

      return true
    } finally {
      preloadedTrack = null
    }
  }

  /**
   * 清理预加载的音轨资源
   */
  function clearPreloadedTrack() {
    if (preloadedTrack) {
      URL.revokeObjectURL(preloadedTrack.blobUrl)
      preloadedTrack = null
    }
  }

  return {
    isPreloading,
    preloadTrack,
    applyPreloadedTrack,
    clearPreloadedTrack
  }
}

import type { AudioFile } from './usePlaylist'
import { useAudioPlayback } from './useAudioPlayback'
import { useAudioPreload } from './useAudioPreload'
import { formatTime } from './useAudioFormat'

/**
 * 音频核心控制 Hook
 * 整合各个音频控制模块，提供统一的音频播放控制接口
 */
export function useAudioCore() {
  const {
    audio,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    volume,
    setVolume,
    playTrack: playTrackWithoutPreload,
    togglePlay,
    seekTo,
    stop,
    onTrackEnded,
    onNearEnd,
    initAudio
  } = useAudioPlayback()

  const { isPreloading, preloadTrack, applyPreloadedTrack } = useAudioPreload()

  /**
   * 播放指定音轨
   * 优先使用预加载的音轨，如果未预加载则加载新音轨
   * @param track 音频文件信息
   */
  async function playTrack(track: AudioFile) {
    if (!audio.value) return

    // 尝试使用预加载的音轨
    if (await applyPreloadedTrack(track, audio.value)) {
      await audio.value.play()
      isPlaying.value = true
    } else {
      // 没有预加载音轨，正常加载
      await playTrackWithoutPreload(track)
    }
  }

  onMounted(() => {
    initAudio()
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

import { throttle } from 'lodash-es'

/**
 * 音频事件管理 Hook
 * 提供音频元素的事件绑定和回调管理功能
 */
export function useAudioEvents() {
  let onTrackEndedCallback: (() => void) | null = null
  let onNearEndCallback: (() => void) | null = null
  const NEAR_END_THRESHOLD = 10 // 距离结尾10秒时触发预加载

  /**
   * 绑定音频事件监听器
   * @param audio Audio 元素引用
   * @param currentTime 当前时间引用
   * @param duration 持续时间引用
   */
  function bindAudioEvents(
    audio: HTMLAudioElement,
    currentTime: Ref<number>,
    duration: Ref<number>
  ) {
    // 时间更新事件 - 限流处理（20ms精度）
    audio.addEventListener(
      'timeupdate',
      throttle(() => {
        currentTime.value = audio.currentTime

        // 检查是否接近结尾，触发预加载
        const remainingTime = (audio.duration || 0) - audio.currentTime
        if (remainingTime > 0 && remainingTime <= NEAR_END_THRESHOLD && onNearEndCallback) {
          onNearEndCallback()
          onNearEndCallback = null
        }
      }, 20)
    )

    // 加载元数据事件
    audio.addEventListener('loadedmetadata', () => {
      duration.value = audio.duration
    })

    // 播放结束事件
    audio.addEventListener('ended', () => {
      if (onTrackEndedCallback) {
        onTrackEndedCallback()
      }
    })

    // 错误事件
    audio.addEventListener('error', () => {
      console.error('Audio error:', audio.error)
    })
  }

  /**
   * 注册曲目结束回调
   * @param callback 回调函数
   */
  function onTrackEnded(callback: () => void) {
    onTrackEndedCallback = callback
  }

  /**
   * 注册接近结尾回调（用于预加载）
   * @param callback 回调函数
   */
  function onNearEnd(callback: () => void) {
    onNearEndCallback = callback
  }

  return {
    bindAudioEvents,
    onTrackEnded,
    onNearEnd
  }
}

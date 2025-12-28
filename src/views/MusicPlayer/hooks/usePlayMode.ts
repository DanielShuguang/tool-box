import { useMusicPlayerStore, type PlayMode } from '@/stores/musicPlayer'

/**
 * 播放模式控制 Hook
 * 管理播放模式的切换和持久化
 */
export function usePlayMode() {
  const message = useMessage()
  const musicPlayerStore = useMusicPlayerStore()
  const { playMode } = storeToRefs(musicPlayerStore)
  const { togglePlayMode: storeTogglePlayMode } = musicPlayerStore

  function updatePlayMode(mode: PlayMode) {
    playMode.value = mode
  }

  /**
   * 切换播放模式
   * 循环切换：顺序 -> 列表循环 -> 单曲循环 -> 随机 -> 顺序
   */
  function togglePlayMode() {
    storeTogglePlayMode()
    const modeNames: Record<PlayMode, string> = {
      sequence: '顺序播放',
      loop: '列表循环',
      single: '单曲循环',
      random: '随机播放'
    }
    message.success(`切换到${modeNames[playMode.value]}`)
  }

  return {
    playMode,
    updatePlayMode,
    togglePlayMode
  }
}

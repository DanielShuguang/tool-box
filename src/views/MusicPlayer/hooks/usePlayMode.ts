import { computed } from 'vue'
import { useMessage } from 'naive-ui'
import { usePersistentStorage } from '@/hooks/usePersistentStorage'
import { ConfigFile } from '@/utils/storage'
import type { PlayMode } from './usePlaylist'

/**
 * 播放模式控制 Hook
 * 管理播放模式的切换和持久化
 */
export function usePlayMode() {
  const message = useMessage()

  const playerState = usePersistentStorage(
    'player-state',
    {
      volume: 0.8,
      playMode: 'sequence' as PlayMode,
      currentTrackId: null as string | null,
      playlist: []
    },
    ConfigFile.MusicPlayer
  )

  const playMode = computed(() => playerState.value.playMode)

  function updatePlayMode(mode: PlayMode) {
    playerState.value.playMode = mode
  }

  /**
   * 切换播放模式
   * 循环切换：顺序 -> 列表循环 -> 单曲循环 -> 随机 -> 顺序
   */
  function togglePlayMode() {
    const modes: PlayMode[] = ['sequence', 'loop', 'single', 'random']
    const currentModeIndex = modes.indexOf(playMode.value)
    const newMode = modes[(currentModeIndex + 1) % modes.length]
    updatePlayMode(newMode)

    const modeNames = {
      sequence: '顺序播放',
      loop: '列表循环',
      single: '单曲循环',
      random: '随机播放'
    }
    message.success(`切换到${modeNames[newMode]}`)
  }

  return {
    playMode,
    updatePlayMode,
    togglePlayMode
  }
}

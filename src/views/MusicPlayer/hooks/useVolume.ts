import { useMusicPlayerStore } from '@/stores/musicPlayer'

/**
 * 音量控制 Hook
 * 管理音量的状态和持久化
 */
export function useVolume() {
  const musicPlayerStore = useMusicPlayerStore()
  const { volume } = storeToRefs(musicPlayerStore)

  function setVolume(vol: number) {
    volume.value = vol
  }

  return {
    volume,
    setVolume
  }
}

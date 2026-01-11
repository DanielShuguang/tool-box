import { readAudioFile } from '@/backend-channel/music-player'
import type { AudioFile } from './usePlaylist'
import { useVolume } from './useVolume'
import { getMimeType } from './useAudioFormat'
import { useAudioEvents } from './useAudioEvents'

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

  function initAudio() {
    audio.value = new Audio()
    syncVolumeToAudio()
    if (audio.value) {
      bindAudioEvents(audio.value, currentTime, duration)
    }
  }

  function syncVolumeToAudio() {
    if (audio.value) {
      audio.value.volume = volume.value
    }
  }

  watch(volume, syncVolumeToAudio)

  function setVolume(vol: number) {
    const clampedVol = Math.max(0, Math.min(100, Math.round(vol))) / 100
    if (audio.value) {
      audio.value.volume = clampedVol
    }
    setPersistedVolume(clampedVol)
  }

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
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl)
        currentBlobUrl = null
      }

      const audioData = await readAudioFile({ filePath: track.path })
      const mimeType = getMimeType(track.path)
      const blob = new Blob([audioData], { type: mimeType })
      currentBlobUrl = URL.createObjectURL(blob)

      audio.value.src = currentBlobUrl
      syncVolumeToAudio()
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

  function seekTo(time: number) {
    if (audio.value) {
      audio.value.currentTime = time
      currentTime.value = time
    }
  }

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

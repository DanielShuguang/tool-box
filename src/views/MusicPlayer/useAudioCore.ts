import { ref, onMounted, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { readAudioFile } from '@/backend-channel/music-player'
import type { AudioFile } from './usePlaylist'

export function useAudioCore() {
  const message = useMessage()

  const audio = ref<HTMLAudioElement | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)

  let onTrackEndedCallback: (() => void) | null = null

  function initAudio() {
    audio.value = new Audio()

    audio.value.addEventListener('timeupdate', () => {
      if (audio.value) {
        currentTime.value = audio.value.currentTime
      }
    })

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
      if (error) {
        console.error('Audio error:', error)
        message.error('音频播放失败，将自动跳过')
      }
    })
  }

  function setVolume(vol: number) {
    if (audio.value) {
      audio.value.volume = vol
    }
  }

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

  async function playTrack(track: AudioFile) {
    if (!audio.value) return

    try {
      const base64 = await readAudioFile({ filePath: track.path })

      const mimeType = getMimeType(track.path)
      const byteCharacters = atob(base64)
      const byteNumbers = Array.from({ length: byteCharacters.length }, (_, i) =>
        byteCharacters.charCodeAt(i)
      )
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })
      const blobUrl = URL.createObjectURL(blob)

      audio.value.src = blobUrl
      await audio.value.play()
      isPlaying.value = true
    } catch (err) {
      message.error('音频加载失败')
      console.error('Audio load error:', err)
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
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
  }

  function onTrackEnded(callback: () => void) {
    onTrackEndedCallback = callback
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

  onUnmounted(() => {
    stop()
  })

  return {
    audio,
    isPlaying,
    currentTime,
    duration,
    setVolume,
    playTrack,
    togglePlay,
    seekTo,
    stop,
    onTrackEnded,
    formatTime
  }
}

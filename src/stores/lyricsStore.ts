import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type LyricsState = 'idle' | 'loading' | 'success' | 'error' | 'empty'

export interface LyricsLine {
  time: number
  text: string
}

export const useLyricsStore = defineStore('lyrics', () => {
  const lyricsState = ref<LyricsState>('idle')
  const currentLyrics = ref<LyricsLine[]>([])
  const currentTrackId = ref<string | null>(null)
  const currentLineIndex = ref<number>(-1)
  const isVisible = ref<boolean>(true)
  const errorMessage = ref<string>('')
  const isLyricsEnabled = ref<boolean>(true)

  const currentLine = computed(() => {
    if (currentLineIndex.value >= 0 && currentLineIndex.value < currentLyrics.value.length) {
      return currentLyrics.value[currentLineIndex.value]
    }
    return null
  })

  const hasLyrics = computed(() => {
    return lyricsState.value === 'success' && currentLyrics.value.length > 0
  })

  const currentLyricText = computed(() => {
    if (currentLineIndex.value >= 0 && currentLineIndex.value < currentLyrics.value.length) {
      return currentLyrics.value[currentLineIndex.value].text || ''
    }
    return ''
  })

  function setLyricsState(state: LyricsState) {
    lyricsState.value = state
  }

  function setCurrentLyrics(lyrics: LyricsLine[]) {
    currentLyrics.value = lyrics
  }

  function setCurrentTrackId(trackId: string | null) {
    currentTrackId.value = trackId
  }

  function setCurrentLineIndex(index: number) {
    currentLineIndex.value = index
  }

  function setIsVisible(visible: boolean) {
    isVisible.value = visible
  }

  function setErrorMessage(message: string) {
    errorMessage.value = message
  }

  function setLyricsEnabled(enabled: boolean) {
    isLyricsEnabled.value = enabled
  }

  function resetLyrics() {
    currentLyrics.value = []
    currentTrackId.value = null
    currentLineIndex.value = -1
    lyricsState.value = 'idle'
    errorMessage.value = ''
  }

  function syncToTime(currentTime: number) {
    if (currentLyrics.value.length === 0) {
      currentLineIndex.value = -1
      return
    }

    let index = -1
    for (let i = 0; i < currentLyrics.value.length; i++) {
      if (currentLyrics.value[i].time <= currentTime) {
        index = i
      } else {
        break
      }
    }

    if (index !== currentLineIndex.value) {
      currentLineIndex.value = index
    }
  }

  return {
    lyricsState,
    currentLyrics,
    currentTrackId,
    currentLineIndex,
    isVisible,
    errorMessage,
    isLyricsEnabled,
    currentLine,
    hasLyrics,
    currentLyricText,
    setLyricsState,
    setCurrentLyrics,
    setCurrentTrackId,
    setCurrentLineIndex,
    setIsVisible,
    setErrorMessage,
    setLyricsEnabled,
    resetLyrics,
    syncToTime
  }
})

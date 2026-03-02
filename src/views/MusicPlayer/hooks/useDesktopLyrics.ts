import {
  createLyricsWindow,
  closeLyricsWindow,
  sendLyricsToWindow,
  checkLyricsWindowOpen,
  clearLyricsWindow,
  updateLyricsStyle
} from '@/backend-channel/desktop-lyrics'
import type { LyricsStyle } from '@/types/lyrics'

export function useDesktopLyrics() {
  const isLyricsWindowOpenState = ref(false)

  async function checkAndSyncState() {
    isLyricsWindowOpenState.value = await checkLyricsWindowOpen()
  }

  async function createWindow() {
    await createLyricsWindow()
    isLyricsWindowOpenState.value = true
  }

  async function closeWindow() {
    await closeLyricsWindow()
    isLyricsWindowOpenState.value = false
  }

  async function sendLyrics(text: string) {
    await sendLyricsToWindow(text)
  }

  async function clearLyrics() {
    await clearLyricsWindow()
  }

  async function changeStyle(style: LyricsStyle) {
    await updateLyricsStyle(style)
  }

  onMounted(() => {
    checkAndSyncState()
  })

  return {
    isLyricsWindowOpen: isLyricsWindowOpenState,
    createLyricsWindow: createWindow,
    closeLyricsWindow: closeWindow,
    sendLyricsToWindow: sendLyrics,
    checkLyricsWindowOpen: checkAndSyncState,
    clearLyricsWindow: clearLyrics,
    updateLyricsStyle: changeStyle
  }
}

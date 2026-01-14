import { invoke } from '@tauri-apps/api/core'
import { ref } from 'vue'

export function useDesktopLyrics() {
  const isLyricsWindowOpen = ref(false)

  async function createLyricsWindow() {
    try {
      await invoke('create_lyrics_window')
      isLyricsWindowOpen.value = true
    } catch (error) {
      console.error('创建歌词窗口失败:', error)
      throw error
    }
  }

  async function closeLyricsWindow() {
    try {
      await invoke('close_lyrics_window')
      isLyricsWindowOpen.value = false
    } catch (error) {
      console.error('关闭歌词窗口失败:', error)
      throw error
    }
  }

  async function sendLyricsToWindow(text: string) {
    if (!isLyricsWindowOpen.value) return

    try {
      await invoke('send_lyrics_to_window', {
        eventType: 'update-lyrics',
        data: { text }
      })
    } catch (error) {
      console.error('发送歌词失败:', error)
    }
  }

  async function checkLyricsWindowOpen() {
    try {
      isLyricsWindowOpen.value = await invoke<boolean>('is_lyrics_window_open')
    } catch (error) {
      console.error('检查歌词窗口状态失败:', error)
    }
  }

  async function clearLyricsWindow() {
    if (!isLyricsWindowOpen.value) return

    try {
      await invoke('send_lyrics_to_window', {
        eventType: 'clear-lyrics',
        data: {}
      })
    } catch (error) {
      console.error('清除歌词失败:', error)
    }
  }

  async function updateLyricsStyle(style: {
    backgroundColor?: string
    fontSize?: number
    fontColor?: string
  }) {
    if (!isLyricsWindowOpen.value) return

    try {
      await invoke('send_lyrics_to_window', {
        eventType: 'update-style',
        data: style
      })
    } catch (error) {
      console.error('更新歌词样式失败:', error)
    }
  }

  return {
    isLyricsWindowOpen,
    createLyricsWindow,
    closeLyricsWindow,
    sendLyricsToWindow,
    checkLyricsWindowOpen,
    clearLyricsWindow,
    updateLyricsStyle
  }
}

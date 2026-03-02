import { createWindow, closeWindow, sendEventToWindow, isWindowOpen } from './window'
import type { LyricsStyle } from '@/types/lyrics'

const LYRICS_WINDOW_LABEL = 'lyrics-window'

export async function createLyricsWindow(): Promise<void> {
  await createWindow(LYRICS_WINDOW_LABEL)
}

export async function closeLyricsWindow(): Promise<void> {
  await closeWindow(LYRICS_WINDOW_LABEL)
}

export async function sendLyricsToWindow(text: string): Promise<void> {
  await sendEventToWindow(LYRICS_WINDOW_LABEL, 'update-lyrics', { text })
}

export async function checkLyricsWindowOpen(): Promise<boolean> {
  return await isWindowOpen(LYRICS_WINDOW_LABEL)
}

export async function clearLyricsWindow(): Promise<void> {
  await sendEventToWindow(LYRICS_WINDOW_LABEL, 'clear-lyrics', {})
}

export async function updateLyricsStyle(style: LyricsStyle): Promise<void> {
  await sendEventToWindow(LYRICS_WINDOW_LABEL, 'update-style', style)
}

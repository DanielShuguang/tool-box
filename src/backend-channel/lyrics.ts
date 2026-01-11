import { invoke } from '@tauri-apps/api/core'
import type { LyricsData, LyricsCacheInfo } from './models/lyrics'

export interface SaveLyricsPayload {
  trackId: string
  lyrics: LyricsData
}

export interface GetLyricsCachePayload {
  trackId: string
}

export interface CleanupLRUPayload {
  maxSize: number
}

export async function saveLyricsCache(trackId: string, lyricsData: LyricsData): Promise<boolean> {
  try {
    await invoke('save_lyrics_cache', {
      trackId,
      lyricsData: JSON.stringify(lyricsData)
    })
    return true
  } catch (error) {
    console.error('Failed to save lyrics cache:', error)
    return false
  }
}

export async function readLyricsCache(trackId: string): Promise<LyricsData | null> {
  try {
    const result = await invoke<string>('read_lyrics_cache', { trackId })
    return JSON.parse(result)
  } catch {
    return null
  }
}

export async function deleteLyricsCache(trackId: string): Promise<boolean> {
  try {
    await invoke('delete_lyrics_cache', { trackId })
    return true
  } catch (error) {
    console.error('Failed to delete lyrics cache:', error)
    return false
  }
}

export async function clearAllLyricsCache(): Promise<number> {
  try {
    const result = await invoke<number>('clear_all_lyrics_cache')
    return result
  } catch (error) {
    console.error('Failed to clear all lyrics cache:', error)
    return 0
  }
}

export async function getLyricsCacheInfo(maxSize: number): Promise<LyricsCacheInfo> {
  try {
    return await invoke<LyricsCacheInfo>('get_lyrics_cache_info', { maxSize })
  } catch (error) {
    console.error('Failed to get lyrics cache info:', error)
    return {
      totalSize: 0,
      fileCount: 0,
      maxSize
    }
  }
}

export async function cleanupLyricsCacheByLRU(maxSize: number): Promise<number> {
  try {
    return await invoke<number>('cleanup_lyrics_cache_by_lru', { maxSize })
  } catch (error) {
    console.error('Failed to cleanup lyrics cache by LRU:', error)
    return 0
  }
}

export async function getLyricsCachePath(): Promise<string> {
  try {
    return await invoke<string>('get_lyrics_cache_path')
  } catch (error) {
    console.error('Failed to get lyrics cache path:', error)
    return ''
  }
}

export async function setLyricsCachePath(path: string): Promise<boolean> {
  try {
    await invoke('set_lyrics_cache_path', { path })
    return true
  } catch (error) {
    console.error('Failed to set lyrics cache path:', error)
    return false
  }
}

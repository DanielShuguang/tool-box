import { ref } from 'vue'
import {
  saveLyricsCache,
  readLyricsCache,
  deleteLyricsCache,
  clearAllLyricsCache,
  getLyricsCacheInfo,
  cleanupLyricsCacheByLRU,
  getLyricsCachePath,
  setLyricsCachePath
} from '@/backend-channel/lyrics'
import type { LyricsData } from '@/backend-channel/models/lyrics'

const DEFAULT_CACHE_SIZE = 100 * 1024 * 1024

export function useLyricsCache() {
  const cacheInfo = ref<{
    totalSize: number
    fileCount: number
    maxSize: number
  }>({
    totalSize: 0,
    fileCount: 0,
    maxSize: DEFAULT_CACHE_SIZE
  })

  const isLoading = ref(false)
  const lyricsCacheSize = ref<number>(DEFAULT_CACHE_SIZE)
  const lyricsCachePath = ref<string>('')

  async function getCacheSizeLimit(): Promise<number> {
    return lyricsCacheSize.value
  }

  async function setCacheSizeLimit(sizeInMB: number): Promise<void> {
    lyricsCacheSize.value = sizeInMB * 1024 * 1024
    await checkAndCleanupLRU(lyricsCacheSize.value)
    await refreshCacheInfo()
  }

  async function getCachePath(): Promise<string> {
    if (!lyricsCachePath.value) {
      lyricsCachePath.value = await getLyricsCachePath()
    }
    return lyricsCachePath.value
  }

  async function updateCachePath(path: string): Promise<boolean> {
    const success = await setLyricsCachePath(path)
    if (success) {
      lyricsCachePath.value = path
      await refreshCacheInfo()
    }
    return success
  }

  async function saveCache(trackId: string, lyrics: LyricsData): Promise<boolean> {
    const maxSize = await getCacheSizeLimit()

    const saved = await saveLyricsCache(trackId, lyrics)
    if (saved) {
      await checkAndCleanupLRU(maxSize)
      await refreshCacheInfo()
    }

    return saved
  }

  async function loadCache(trackId: string): Promise<LyricsData | null> {
    return await readLyricsCache(trackId)
  }

  async function removeCache(trackId: string): Promise<boolean> {
    const removed = await deleteLyricsCache(trackId)
    if (removed) {
      await refreshCacheInfo()
    }
    return removed
  }

  async function clearAll(): Promise<number> {
    const count = await clearAllLyricsCache()
    await refreshCacheInfo()
    return count
  }

  async function refreshCacheInfo(): Promise<void> {
    const maxSize = await getCacheSizeLimit()
    cacheInfo.value = await getLyricsCacheInfo(maxSize)
  }

  async function checkAndCleanupLRU(maxSize: number): Promise<void> {
    await refreshCacheInfo()

    if (cacheInfo.value.totalSize > maxSize) {
      await cleanupLyricsCacheByLRU(maxSize)
      await refreshCacheInfo()
    }
  }

  function formatCacheSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }
  }

  return {
    cacheInfo,
    isLoading,
    lyricsCacheSize,
    lyricsCachePath,
    saveCache,
    loadCache,
    removeCache,
    clearAll,
    refreshCacheInfo,
    getCacheSizeLimit,
    setCacheSizeLimit,
    getCachePath,
    updateCachePath,
    formatCacheSize
  }
}

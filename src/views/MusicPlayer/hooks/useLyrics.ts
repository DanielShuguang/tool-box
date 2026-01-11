import { computed } from 'vue'
import { lyricsService } from '@/services/lyricsService'
import { lyricsParser } from '@/utils/lyricsParser'
import { useLyricsCache } from './useLyricsCache'
import { useLyricsStore } from '@/stores/lyricsStore'
import type { LyricsData } from '@/backend-channel/models/lyrics'

export type LyricsState = 'idle' | 'loading' | 'success' | 'error' | 'empty'

export function useLyrics() {
  const store = useLyricsStore()
  const { cacheInfo, saveCache, loadCache, refreshCacheInfo } = useLyricsCache()

  const isVisibleValue = computed(() => store.isVisible)

  async function loadLyrics(
    trackId: string,
    trackInfo?: { title?: string; artist?: string }
  ): Promise<boolean> {
    if (!trackId) {
      store.setLyricsState('idle')
      store.setCurrentLyrics([])
      return false
    }

    const currentStoredTrackId = store.currentTrackId
    if (currentStoredTrackId === trackId && store.currentLyrics.length > 0) {
      return true
    }

    store.setCurrentTrackId(trackId)
    store.setLyricsState('loading')
    store.setErrorMessage('')

    try {
      const cached = await loadCache(trackId)
      if (cached && cached.lyrics && cached.lyrics.length > 0) {
        store.setCurrentLyrics(cached.lyrics)
        store.setLyricsState('success')
        return true
      }

      const searchKeyword = trackInfo?.title
        ? `${trackInfo.title}${trackInfo.artist ? ' ' + trackInfo.artist : ''}`
        : null

      let lyricsContent: string | null = null

      if (searchKeyword) {
        const searchResults = await lyricsService.searchLyrics(searchKeyword)
        if (searchResults.length > 0) {
          const firstResult = searchResults[0]
          lyricsContent = await lyricsService.getLyricsById(firstResult.id, firstResult.mid)
        }
      }

      if (lyricsContent) {
        const parsed = lyricsParser.parse(lyricsContent)
        store.setCurrentLyrics(parsed.lines)

        const lyricsData: LyricsData = {
          trackId,
          songName: trackInfo?.title || '未知歌曲',
          artist: trackInfo?.artist || '未知艺术家',
          source: 'QQMusic',
          format: parsed.format,
          cachedAt: new Date().toISOString(),
          lyrics: parsed.lines
        }

        await saveCache(trackId, lyricsData)
        store.setLyricsState('success')
        return true
      }

      store.setLyricsState('empty')
      store.setCurrentLyrics([])
      return false
    } catch (error) {
      console.error('Failed to load lyrics:', error)
      store.setLyricsState('error')
      store.setErrorMessage(error instanceof Error ? error.message : '加载歌词失败')
      return false
    }
  }

  function clearLyrics(): void {
    store.resetLyrics()
  }

  function setLyricsManually(lyricsContent: string, format?: string): void {
    const parsed = lyricsParser.parse(lyricsContent, format as 'lrc' | 'qrc' | 'ksc' | undefined)
    store.setCurrentLyrics(parsed.lines)
    store.setLyricsState('success')

    const storedTrackId = store.currentTrackId
    if (storedTrackId) {
      const lyricsData: LyricsData = {
        trackId: storedTrackId,
        songName: '手动编辑',
        artist: '用户',
        source: 'Manual',
        format: parsed.format,
        cachedAt: new Date().toISOString(),
        lyrics: parsed.lines
      }

      saveCache(storedTrackId, lyricsData)
    }
  }

  async function saveManualLyrics(
    trackId: string,
    lyrics: { time: number; text: string }[],
    trackInfo?: { title?: string; artist?: string }
  ): Promise<void> {
    const lyricsData: LyricsData = {
      trackId,
      songName: trackInfo?.title || '手动编辑',
      artist: trackInfo?.artist || '用户',
      source: 'Manual',
      format: 'lrc',
      cachedAt: new Date().toISOString(),
      lyrics
    }

    store.setCurrentLyrics(lyrics)
    store.setLyricsState('success')
    store.setCurrentTrackId(trackId)

    await saveCache(trackId, lyricsData)
    await refreshCacheInfo()
  }

  function toggleVisibility(): void {
    store.setIsVisible(!store.isVisible)
  }

  function setVisibility(visible: boolean): void {
    store.setIsVisible(visible)
  }

  return {
    lyricsState: computed(() => store.lyricsState),
    currentLyrics: computed(() => store.currentLyrics),
    currentLine: computed(() => store.currentLine),
    currentLineIndex: computed(() => store.currentLineIndex),
    isVisible: isVisibleValue,
    errorMessage: computed(() => store.errorMessage),
    cacheInfo: computed(() => cacheInfo.value),
    hasLyrics: computed(() => store.hasLyrics),
    currentLyricText: computed(() => store.currentLyricText),
    loadLyrics,
    syncToTime: store.syncToTime,
    clearLyrics,
    setLyricsManually,
    saveManualLyrics,
    toggleVisibility,
    setVisibility,
    refreshCacheInfo,
    setLyricsEnabled: store.setLyricsEnabled
  }
}

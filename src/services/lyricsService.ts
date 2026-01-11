import { get } from '@/utils/request'
import type { LyricsSearchResult } from '@/backend-channel/models/lyrics'

const QQ_MUSIC_LYRIC_API = 'https://oiapi.net/api/QQMusicLyric'

export interface LyricsServiceConfig {
  timeout?: number
  retries?: number
}

export class LyricsService {
  private config: LyricsServiceConfig

  constructor(config: LyricsServiceConfig = {}) {
    this.config = {
      timeout: 5000,
      retries: 2,
      ...config
    }
  }

  async searchLyrics(keyword: string): Promise<LyricsSearchResult[]> {
    try {
      const response = await this.requestWithCache<{
        code: number
        message: string
        data: LyricsSearchResult[]
      }>(`${QQ_MUSIC_LYRIC_API}?keyword=${encodeURIComponent(keyword)}`)

      if (response.code === 1 && Array.isArray(response.data)) {
        return response.data
      }

      return []
    } catch (error) {
      console.error('Failed to search lyrics:', error)
      return []
    }
  }

  async getLyricsById(id: string, mid?: string, format: string = 'lrc'): Promise<string | null> {
    try {
      let url = `${QQ_MUSIC_LYRIC_API}?id=${id}&format=${format}`
      if (mid) {
        url += `&n=1`
      }

      const response = await this.requestWithCache<{
        code: number
        message: string
        data: {
          content?: string
          base64?: string
        }
      }>(url)

      if (response.code === 1 && response.data) {
        if (response.data.content) {
          return response.data.content
        }
        if (response.data.base64) {
          try {
            return atob(response.data.base64)
          } catch {
            return null
          }
        }
      }

      return null
    } catch (error) {
      console.error('Failed to get lyrics by ID:', error)
      return null
    }
  }

  private async requestWithCache<T>(url: string): Promise<T> {
    return get<T>(url, {
      timeout: this.config.timeout,
      retries: this.config.retries,
      onError: error => {
        console.warn('Lyrics API request failed, will retry:', error.message)
      }
    })
  }
}

export const lyricsService = new LyricsService()

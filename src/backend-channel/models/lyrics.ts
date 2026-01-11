export interface LyricsLine {
  time: number
  text: string
}

export interface LyricsData {
  trackId: string
  songName: string
  artist: string
  source: 'QQMusic' | 'Manual' | 'Upload'
  format: 'lrc' | 'qrc' | 'ksc'
  cachedAt: string
  lyrics: LyricsLine[]
}

export interface LyricsSearchResult {
  name: string
  singer: string[]
  album: string
  mid: string
  id: string
  album_mid: string
  duration: number
  image: string
}

export interface SearchLyricsPayload {
  keyword: string
}

export interface GetLyricsPayload {
  id: string
  mid?: string
  format?: string
}

export interface SaveLyricsPayload {
  trackId: string
  lyrics: LyricsData
}

export interface LyricsCacheInfo {
  totalSize: number
  fileCount: number
  maxSize: number
}

export interface BackendLyricsResponse {
  code: number
  message: string
  data:
    | {
        content?: string
        base64?: string
      }
    | LyricsSearchResult[]
}

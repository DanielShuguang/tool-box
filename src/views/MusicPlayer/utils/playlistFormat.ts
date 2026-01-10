import type { Playlist, AudioFile } from '@/stores/musicPlayer'

export type PlaylistFormat = 'json' | 'm3u8' | 'pls'

export interface ExportOptions {
  format: PlaylistFormat
  playlist: Playlist
}

export interface ImportResult {
  playlist: Playlist
  format: PlaylistFormat
  invalidPaths: AudioFile[]
}

/**
 * JSON导出数据结构
 */
export interface JsonExportData {
  version: string
  exportTime: string
  exportType: 'current'
  playlists: JsonPlaylist[]
}

export interface JsonPlaylist {
  name: string
  sortOption: string
  sortOrder: string
  isDefault: boolean
  tracks: JsonTrack[]
}

export interface JsonTrack {
  id: string
  name: string
  path: string
  title?: string
  artist?: string
  album?: string
  duration?: number
}

/**
 * 导出为JSON格式
 */
export function exportToJson(playlist: Playlist): string {
  const data: JsonExportData = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    exportType: 'current',
    playlists: [
      {
        name: playlist.name,
        sortOption: playlist.sortOption,
        sortOrder: playlist.sortOrder,
        isDefault: playlist.isDefault,
        tracks: playlist.tracks.map(track => ({
          id: track.id,
          name: track.name,
          path: track.path.replace(/\\/g, '/'),
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.duration
        }))
      }
    ]
  }

  return JSON.stringify(data, null, 2)
}

/**
 * 导出为M3U8格式
 */
export function exportToM3U8(playlist: Playlist): string {
  const lines: string[] = []

  lines.push('#EXTM3U')
  lines.push(`#PLAYLIST:${playlist.name}`)

  for (const track of playlist.tracks) {
    const title = [track.artist, track.title].filter(Boolean).join(' - ') || track.name
    const duration = track.duration ?? -1
    lines.push(`#EXTINF:${duration},${title}`)
    lines.push(track.path)
  }

  return lines.join('\n')
}

/**
 * 导出为PLS格式
 */
export function exportToPLS(playlist: Playlist): string {
  const lines: string[] = []

  lines.push('[playlist]')
  lines.push(`PlaylistName=${playlist.name}`)
  lines.push(`NumberOfEntries=${playlist.tracks.length}`)

  for (let i = 0; i < playlist.tracks.length; i++) {
    const track = playlist.tracks[i]
    const title = [track.artist, track.title].filter(Boolean).join(' - ') || track.name
    const duration = track.duration ?? -1

    lines.push(`File${i + 1}=${track.path}`)
    lines.push(`Title${i + 1}=${title}`)
    lines.push(`Length${i + 1}=${duration}`)
  }

  lines.push('Version=2')

  return lines.join('\n')
}

/**
 * 从JSON导入
 */
export function importFromJson(content: string): ImportResult {
  const data = JSON.parse(content) as JsonExportData

  if (!data.playlists || data.playlists.length === 0) {
    throw new Error('JSON文件中没有播放列表数据')
  }

  const jsonPlaylist = data.playlists[0]

  const playlist: Playlist = {
    id: generatePlaylistId(),
    name: jsonPlaylist.name,
    sortOption: (jsonPlaylist.sortOption ?? 'default') as Playlist['sortOption'],
    sortOrder: (jsonPlaylist.sortOrder ?? 'asc') as 'asc' | 'desc',
    isDefault: false,
    tracks: jsonPlaylist.tracks.map(track => ({
      id: generateTrackId(),
      name: track.name,
      path: track.path,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration
    }))
  }

  return { playlist, format: 'json', invalidPaths: [] }
}

/**
 * 从M3U8导入
 */
export function importFromM3U8(content: string): ImportResult {
  const lines = content.split('\n').map(line => line.trim())
  let playlistName = '导入的播放列表'
  const tracks: AudioFile[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('#PLAYLIST:')) {
      playlistName = line.substring('#PLAYLIST:'.length)
    } else if (line.startsWith('#EXTINF:')) {
      const extInf = line.substring('#EXTINF:'.length)
      const [durationPart, ...titleParts] = extInf.split(',')
      const duration = parseInt(durationPart, 10) || undefined
      const title = titleParts.join(',')

      const nextLine = lines[i + 1]?.trim()
      if (nextLine && !nextLine.startsWith('#')) {
        const artist = extractArtist(title)
        const trackTitle = extractTitle(title, artist)

        tracks.push({
          id: generateTrackId(),
          name: nextLine.split(/[/\\]/).pop() || nextLine,
          path: nextLine,
          title: trackTitle,
          artist,
          album: undefined,
          duration: duration === -1 ? undefined : duration
        })
      }
    } else if (line && !line.startsWith('#')) {
      tracks.push({
        id: generateTrackId(),
        name: line.split(/[/\\]/).pop() || line,
        path: line
      })
    }
  }

  const playlist: Playlist = {
    id: generatePlaylistId(),
    name: playlistName,
    sortOption: 'default',
    sortOrder: 'asc',
    isDefault: false,
    tracks
  }

  return { playlist, format: 'm3u8', invalidPaths: [] }
}

/**
 * 从PLS导入
 */
export function importFromPLS(content: string): ImportResult {
  const lines = content.split('\n').map(line => line.trim())
  let playlistName = '导入的播放列表'
  const trackMap = new Map<number, { file: string; title: string; length: number }>()

  for (const line of lines) {
    if (line.startsWith('PlaylistName=')) {
      playlistName = line.substring('PlaylistName='.length)
    } else if (line.startsWith('File')) {
      const match = line.match(/^File(\d+)=(.+)$/)
      if (match) {
        const index = parseInt(match[1], 10)
        const existing = trackMap.get(index) || { file: '', title: '', length: -1 }
        existing.file = match[2]
        trackMap.set(index, existing)
      }
    } else if (line.startsWith('Title')) {
      const match = line.match(/^Title(\d+)=(.+)$/)
      if (match) {
        const index = parseInt(match[1], 10)
        const existing = trackMap.get(index) || { file: '', title: '', length: -1 }
        existing.title = match[2]
        trackMap.set(index, existing)
      }
    } else if (line.startsWith('Length')) {
      const match = line.match(/^Length(\d+)=(.+)$/)
      if (match) {
        const index = parseInt(match[1], 10)
        const existing = trackMap.get(index) || { file: '', title: '', length: -1 }
        existing.length = parseInt(match[2], 10)
        trackMap.set(index, existing)
      }
    }
  }

  const tracks: AudioFile[] = []

  for (const [_, data] of trackMap) {
    const artist = extractArtist(data.title)
    const trackTitle = extractTitle(data.title, artist)

    tracks.push({
      id: generateTrackId(),
      name: data.file.split(/[/\\]/).pop() || data.file,
      path: data.file,
      title: trackTitle,
      artist,
      album: undefined,
      duration: data.length === -1 ? undefined : data.length
    })
  }

  const playlist: Playlist = {
    id: generatePlaylistId(),
    name: playlistName,
    sortOption: 'default',
    sortOrder: 'asc',
    isDefault: false,
    tracks
  }

  return { playlist, format: 'pls', invalidPaths: [] }
}

/**
 * 根据文件扩展名自动检测格式
 */
export function autoDetectFormat(filePath: string): PlaylistFormat {
  const ext = filePath.toLowerCase().split('.').pop()

  switch (ext) {
    case 'json':
      return 'json'
    case 'm3u':
    case 'm3u8':
      return 'm3u8'
    case 'pls':
      return 'pls'
    default:
      throw new Error(`不支持的文件格式: ${ext}`)
  }
}

/**
 * 生成播放列表ID
 */
function generatePlaylistId(): string {
  return `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 生成歌曲ID
 */
function generateTrackId(): string {
  return `track-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 从标题中提取艺术家（假设格式为 "Artist - Title"）
 */
function extractArtist(title: string): string | undefined {
  const separatorIndex = title.indexOf(' - ')
  if (separatorIndex === -1) return undefined
  return title.substring(0, separatorIndex)
}

/**
 * 从标题中提取歌曲标题
 */
function extractTitle(title: string, artist: string | undefined): string | undefined {
  if (!artist) return title || undefined
  const separatorIndex = title.indexOf(' - ')
  if (separatorIndex === -1) return title || undefined
  return title.substring(separatorIndex + 3)
}

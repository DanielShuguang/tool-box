import type { LyricsLine } from '@/backend-channel/models/lyrics'

export type LyricsFormat = 'lrc' | 'qrc' | 'ksc'

export interface ParsedLyrics {
  format: LyricsFormat
  lines: LyricsLine[]
  raw?: string
}

interface LyricsParser {
  format: LyricsFormat
  parse(content: string): LyricsLine[]
}

class LrcParser implements LyricsParser {
  format: LyricsFormat = 'lrc'

  parse(content: string): LyricsLine[] {
    const lines = content.split('\n')
    const result: LyricsLine[] = []

    for (const line of lines) {
      const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/)
      if (match) {
        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)
        const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0
        const time = minutes * 60 + seconds + ms / 1000
        const text = match[4].trim()

        if (text) {
          result.push({ time, text })
        }
      }
    }

    return result.sort((a, b) => a.time - b.time)
  }
}

class QrcParser implements LyricsParser {
  format: LyricsFormat = 'qrc'

  parse(content: string): LyricsLine[] {
    const lines = content.split('\n')
    const result: LyricsLine[] = []

    for (const line of lines) {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{3}),([^\]]+)\]/)
      if (match) {
        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)
        const ms = parseInt(match[3], 10)
        const time = minutes * 60 + seconds + ms / 1000
        const text = match[4].trim()

        if (text) {
          result.push({ time, text })
        }
      }
    }

    return result.sort((a, b) => a.time - b.time)
  }
}

class KscParser implements LyricsParser {
  format: LyricsFormat = 'ksc'

  parse(content: string): LyricsLine[] {
    const result: LyricsLine[] = []

    const timeLineMatch = content.match(/\[offset:(-?\d+)\]/)
    const offset = timeLineMatch ? parseInt(timeLineMatch[1], 10) / 1000 : 0

    const timeTagRegex = /(\d+):(\d{2})\.(\d{2})\s+(.+)/g
    let match

    while ((match = timeTagRegex.exec(content)) !== null) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const ms = parseInt(match[3], 10)
      const time = minutes * 60 + seconds + ms / 100 + offset
      const text = match[4].trim()

      if (text) {
        result.push({ time, text })
      }
    }

    return result.sort((a, b) => a.time - b.time)
  }
}

class LyricsParserFactory {
  private parsers: Map<LyricsFormat, LyricsParser> = new Map([
    ['lrc', new LrcParser()],
    ['qrc', new QrcParser()],
    ['ksc', new KscParser()]
  ])

  parse(content: string, format?: LyricsFormat): ParsedLyrics {
    if (format && this.parsers.has(format)) {
      const parser = this.parsers.get(format)!
      return {
        format,
        lines: parser.parse(content)
      }
    }

    const detectedFormat = this.detectFormat(content)
    const parser = this.parsers.get(detectedFormat)!

    return {
      format: detectedFormat,
      lines: parser.parse(content)
    }
  }

  private detectFormat(content: string): LyricsFormat {
    if (content.includes('[') && content.includes(']:')) {
      return 'qrc'
    }

    if (/^\d+:\d{2}\.\d{2}\s+/.test(content)) {
      return 'ksc'
    }

    return 'lrc'
  }

  getParser(format: LyricsFormat): LyricsParser | undefined {
    return this.parsers.get(format)
  }

  registerParser(format: LyricsFormat, parser: LyricsParser): void {
    this.parsers.set(format, parser)
  }
}

export const lyricsParser = new LyricsParserFactory()

export function formatLyricsToLrc(lines: LyricsLine[]): string {
  return lines
    .map(line => {
      const minutes = Math.floor(line.time / 60)
      const seconds = Math.floor(line.time % 60)
      const ms = Math.floor((line.time % 1) * 100)
      return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}]${line.text}`
    })
    .join('\n')
}

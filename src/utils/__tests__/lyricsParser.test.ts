import { describe, it, expect } from 'vitest'
import { lyricsParser, formatLyricsToLrc } from '../lyricsParser'

describe('lyricsParser', () => {
  describe('LRC format parsing', () => {
    it('should parse standard LRC format', () => {
      const lrcContent = `[00:00.00]歌曲名称
[00:05.50]第一句歌词
[00:10.25]第二句歌词
[00:15.75]第三句歌词`

      const result = lyricsParser.parse(lrcContent)

      expect(result.format).toBe('lrc')
      expect(result.lines).toHaveLength(4)
      expect(result.lines[0]).toEqual({ time: 0, text: '歌曲名称' })
      expect(result.lines[1]).toEqual({ time: 5.5, text: '第一句歌词' })
      expect(result.lines[2]).toEqual({ time: 10.25, text: '第二句歌词' })
      expect(result.lines[3]).toEqual({ time: 15.75, text: '第三句歌词' })
    })

    it('should parse LRC with millisecond precision', () => {
      const lrcContent = `[00:00.000]精确开始
[01:30.999]精确结束`

      const result = lyricsParser.parse(lrcContent)

      expect(result.lines).toHaveLength(2)
      expect(result.lines[0].time).toBe(0)
      expect(result.lines[1].time).toBeCloseTo(90.999, 2)
    })

    it('should parse LRC with 2-digit milliseconds', () => {
      const lrcContent = `[00:00.00]简短毫秒
[00:01.50]`

      const result = lyricsParser.parse(lrcContent)

      expect(result.lines).toHaveLength(1)
      expect(result.lines[0].text).toBe('简短毫秒')
    })

    it('should ignore empty lines', () => {
      const lrcContent = `[00:00.00]第一句

[00:05.00]第三句`

      const result = lyricsParser.parse(lrcContent)

      expect(result.lines).toHaveLength(2)
    })

    it('should ignore lines without time tags', () => {
      const lrcContent = `[00:00.00]有时间的行
没有时间的行
[00:05.00]另一行有时间的`

      const result = lyricsParser.parse(lrcContent)

      expect(result.lines).toHaveLength(2)
    })

    it('should sort lines by time', () => {
      const lrcContent = `[00:10.00]后唱的
[00:05.00]先唱的
[00:00.00]最先唱的`

      const result = lyricsParser.parse(lrcContent)

      expect(result.lines[0].time).toBe(0)
      expect(result.lines[1].time).toBe(5)
      expect(result.lines[2].time).toBe(10)
    })
  })

  describe('QRC format parsing', () => {
    it('should use QRC parser when explicitly specified', () => {
      const qrcContent = `[00:00.00,歌曲名称]
[00:05.50,第一句歌词]`

      const result = lyricsParser.parse(qrcContent, 'qrc')

      expect(result.format).toBe('qrc')
    })

    it('should parse QRC format with proper detection', () => {
      const qrcContent = `[00:00.00,歌曲名称]:这是QRC格式
[00:05.50,第一句歌词]`

      const result = lyricsParser.parse(qrcContent)

      expect(result.format).toBe('qrc')
    })
  })

  describe('KSC format parsing', () => {
    it('should parse KSC format', () => {
      const kscContent = `00:00.00 第一句歌词
00:05.50 第二句歌词`

      const result = lyricsParser.parse(kscContent)

      expect(result.format).toBe('ksc')
      expect(result.lines).toHaveLength(2)
      expect(result.lines[0]).toEqual({ time: 0, text: '第一句歌词' })
      expect(result.lines[1]).toEqual({ time: 5.5, text: '第二句歌词' })
    })

    it('should handle KSC content without offset line', () => {
      const kscContent = `00:00.00 有偏移的歌词`

      const result = lyricsParser.parse(kscContent)

      expect(result.lines.length).toBeGreaterThan(0)
    })
  })

  describe('formatLyricsToLrc', () => {
    it('should convert lyrics lines to LRC format', () => {
      const lines = [
        { time: 0, text: '歌曲名称' },
        { time: 5.5, text: '第一句歌词' },
        { time: 10.25, text: '第二句歌词' }
      ]

      const result = formatLyricsToLrc(lines)

      expect(result).toBe(`[00:00.00]歌曲名称
[00:05.50]第一句歌词
[00:10.25]第二句歌词`)
    })

    it('should handle millisecond precision', () => {
      const lines = [{ time: 90.999, text: '最后一秒' }]

      const result = formatLyricsToLrc(lines)

      expect(result).toBe(`[01:30.99]最后一秒`)
    })

    it('should handle empty array', () => {
      const result = formatLyricsToLrc([])

      expect(result).toBe('')
    })
  })

  describe('format detection', () => {
    it('should auto-detect LRC format', () => {
      const lrcContent = `[00:00.00]标准LRC格式
[00:05.00]`

      const result = lyricsParser.parse(lrcContent)

      expect(result.format).toBe('lrc')
    })

    it('should auto-detect QRC format', () => {
      const qrcContent = `[00:00.00,这是QRC格式]:
[00:05.00,这也是`

      const result = lyricsParser.parse(qrcContent)

      expect(result.format).toBe('qrc')
    })

    it('should auto-detect KSC format', () => {
      const kscContent = `00:00.00 这是KSC格式
00:05.00 这也是`

      const result = lyricsParser.parse(kscContent)

      expect(result.format).toBe('ksc')
    })

    it('should force specified format', () => {
      const content = `[00:00.00]测试内容`

      const result = lyricsParser.parse(content, 'lrc')

      expect(result.format).toBe('lrc')
    })
  })
})

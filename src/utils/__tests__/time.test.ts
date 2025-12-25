import { describe, it, expect } from 'vitest'
import { formatTime, TimeUnits } from '../time'

describe('time utils', () => {
  describe('formatTime', () => {
    it('should format timestamp correctly', () => {
      const timestamp = 1640995200000 // 2022-01-01 00:00:00 UTC
      // 本地时区是UTC+8，所以时间是08:00:00
      expect(formatTime(timestamp)).toBe('2022-01-01 08:00:00')
    })

    it('should format Date object correctly', () => {
      const date = new Date('2022-01-01T00:00:00Z')
      // 本地时区是UTC+8，所以时间是08:00:00
      expect(formatTime(date)).toBe('2022-01-01 08:00:00')
    })

    it('should format date string correctly', () => {
      const dateString = '2022-01-01T00:00:00Z'
      // 本地时区是UTC+8，所以时间是08:00:00
      expect(formatTime(dateString)).toBe('2022-01-01 08:00:00')
    })

    it('should use custom format string', () => {
      const timestamp = 1640995200000
      expect(formatTime(timestamp, 'yyyy-MM-dd')).toBe('2022-01-01')
    })
  })

  describe('TimeUnits', () => {
    it('should have correct values', () => {
      expect(TimeUnits.Millisecond).toBe(1)
      expect(TimeUnits.Second).toBe(1000)
      expect(TimeUnits.Minute).toBe(60000)
      expect(TimeUnits.Hour).toBe(3600000)
      expect(TimeUnits.Day).toBe(86400000)
    })
  })
})

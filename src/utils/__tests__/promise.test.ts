import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sleep } from '../promise'

describe('promise utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('sleep', () => {
    it('应该延迟指定毫秒数后 resolve', async () => {
      const start = Date.now()
      const promise = sleep(100)

      expect(promise).toBeInstanceOf(Promise)

      vi.advanceTimersByTime(100)
      await promise

      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(100)
    })

    it('应该支持 0 毫秒延迟', async () => {
      const start = Date.now()
      const promise = sleep(0)

      vi.advanceTimersByTime(0)
      await promise

      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(0)
    })

    it('不应该在延迟完成前 resolve', async () => {
      let resolved = false
      const promise = sleep(200).then(() => {
        resolved = true
      })

      vi.advanceTimersByTime(100)
      expect(resolved).toBe(false)

      vi.advanceTimersByTime(100)
      await promise
      expect(resolved).toBe(true)
    })
  })
})

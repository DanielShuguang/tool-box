import { describe, it, expect } from 'vitest'

describe('event utils', () => {
  describe('UseEmitterOptions', () => {
    it('应该正确配置 once 选项', () => {
      const options = {
        once: true as const,
        event: 'test',
        handler: () => {}
      }

      expect(options.once).toBe(true)
      expect(options.event).toBe('test')
      expect(typeof options.handler).toBe('function')
    })

    it('应该正确配置普通事件', () => {
      const options = {
        event: 'test',
        handler: () => {}
      }

      expect((options as any).once).toBeUndefined()
      expect(options.event).toBe('test')
    })
  })
})

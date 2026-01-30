import { describe, it, expect } from 'vitest'
import { isDevelopment } from '../development'

describe('development utils', () => {
  describe('isDevelopment', () => {
    it('应该是一个布尔值', () => {
      expect(typeof isDevelopment).toBe('boolean')
    })

    it('应该导出 Vite 的 DEV 环境变量', () => {
      expect(isDevelopment).toBe(import.meta.env.DEV)
    })
  })
})

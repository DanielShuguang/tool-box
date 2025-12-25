import { expect } from 'vitest'
import '@testing-library/jest-dom'

// 全局配置
expect.extend({
  toBeVisible(received) {
    return {
      message: () => `expected ${received} to be visible`,
      pass: received.style.display !== 'none' && received.style.visibility !== 'hidden'
    }
  }
})

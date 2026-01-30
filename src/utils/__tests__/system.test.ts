import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@tauri-apps/plugin-os', () => ({
  platform: vi.fn()
}))

const { platform } = await import('@tauri-apps/plugin-os')

describe('system utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSep', () => {
    it('应该是一个函数', async () => {
      const { getSep } = await import('../system')
      expect(typeof getSep).toBe('function')
    })

    it('在 Windows 系统上应该返回反斜杠', async () => {
      const { getSep } = await import('../system')
      ;(platform as any).mockReturnValue('windows')

      const result = getSep()

      expect(result).toBe('\\')
    })

    it('在 Linux 系统上应该返回正斜杠', async () => {
      const { getSep } = await import('../system')
      ;(platform as any).mockReturnValue('linux')

      const result = getSep()

      expect(result).toBe('/')
    })

    it('在 macOS 系统上应该返回正斜杠', async () => {
      const { getSep } = await import('../system')
      ;(platform as any).mockReturnValue('macos')

      const result = getSep()

      expect(result).toBe('/')
    })
  })
})

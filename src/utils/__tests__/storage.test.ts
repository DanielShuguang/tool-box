import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConfigFile } from '../storage'

vi.mock('@tauri-apps/plugin-store', () => {
  const mockStore = {
    get: vi.fn(),
    set: vi.fn(),
    save: vi.fn()
  }

  return {
    Store: {
      load: vi.fn().mockResolvedValue(mockStore)
    }
  }
})

describe('storage utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ConfigFile 枚举', () => {
    it('应该包含 Settings', () => {
      expect(ConfigFile.Settings).toBe('.settings.dat')
    })

    it('应该包含 EyeProtection', () => {
      expect(ConfigFile.EyeProtection).toBe('.eye-protection.dat')
    })

    it('应该包含 Router', () => {
      expect(ConfigFile.Router).toBe('.router.dat')
    })

    it('应该包含 MusicPlayer', () => {
      expect(ConfigFile.MusicPlayer).toBe('.music-player.dat')
    })

    it('应该包含 Download', () => {
      expect(ConfigFile.Download).toBe('.download.dat')
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScreenshotStore } from '../screenshot'

describe('useScreenshotStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('应该初始化为 null 的 imageData', () => {
      const store = useScreenshotStore()
      expect(store.imageData).toBeNull()
    })

    it('应该初始化为 null 的 captureRegion', () => {
      const store = useScreenshotStore()
      expect(store.captureRegion).toBeNull()
    })

    it('应该默认使用 pencil 工具', () => {
      const store = useScreenshotStore()
      expect(store.currentTool).toBe('pencil')
    })

    it('应该默认颜色为 #FF0000', () => {
      const store = useScreenshotStore()
      expect(store.currentColor).toBe('#FF0000')
    })

    it('应该默认线宽为 2', () => {
      const store = useScreenshotStore()
      expect(store.currentLineWidth).toBe(2)
    })

    it('应该默认字体大小为 16', () => {
      const store = useScreenshotStore()
      expect(store.currentFontSize).toBe(16)
    })

    it('应该包含完整的默认配置', () => {
      const store = useScreenshotStore()
      expect(store.config).toEqual({
        shortcuts: {
          captureFullScreen: 'Ctrl+Shift+S',
          captureRegion: 'Ctrl+Shift+A',
          captureWindow: 'Ctrl+Shift+W'
        },
        save: {
          defaultFormat: 'png',
          defaultPath: '',
          autoCopyToClipboard: false
        },
        editor: {
          defaultColor: '#FF0000',
          defaultLineWidth: 2
        }
      })
    })
  })

  describe('actions', () => {
    it('setImageData 应该更新 imageData', () => {
      const store = useScreenshotStore()
      const data = new Uint8Array([1, 2, 3])
      store.setImageData(data)
      expect(store.imageData).toBe(data)
    })

    it('setCaptureRegion 应该更新 captureRegion', () => {
      const store = useScreenshotStore()
      const region = { x: 100, y: 200, width: 300, height: 400 }
      store.setCaptureRegion(region)
      expect(store.captureRegion).toEqual(region)
    })

    it('setCurrentTool 应该切换工具类型', () => {
      const store = useScreenshotStore()
      store.setCurrentTool('rect')
      expect(store.currentTool).toBe('rect')
      store.setCurrentTool('circle')
      expect(store.currentTool).toBe('circle')
      store.setCurrentTool('text')
      expect(store.currentTool).toBe('text')
    })

    it('setCurrentColor 应该更新颜色', () => {
      const store = useScreenshotStore()
      store.setCurrentColor('#00FF00')
      expect(store.currentColor).toBe('#00FF00')
      store.setCurrentColor('#0000FF')
      expect(store.currentColor).toBe('#0000FF')
    })

    it('setCurrentLineWidth 应该更新线宽', () => {
      const store = useScreenshotStore()
      store.setCurrentLineWidth(5)
      expect(store.currentLineWidth).toBe(5)
    })

    it('setCurrentFontSize 应该更新字体大小', () => {
      const store = useScreenshotStore()
      store.setCurrentFontSize(24)
      expect(store.currentFontSize).toBe(24)
    })

    it('updateConfig 应该合并部分配置', () => {
      const store = useScreenshotStore()
      store.updateConfig({
        shortcuts: {
          captureFullScreen: 'Ctrl+Alt+S',
          captureRegion: 'Ctrl+Alt+A',
          captureWindow: 'Ctrl+Alt+W'
        }
      })
      expect(store.config.shortcuts.captureFullScreen).toBe('Ctrl+Alt+S')
      expect(store.config.save.defaultFormat).toBe('png')
    })

    it('updateConfig 应该支持深层部分更新', () => {
      const store = useScreenshotStore()
      store.updateConfig({
        save: { defaultFormat: 'jpg', defaultPath: '/screenshots', autoCopyToClipboard: true }
      })
      expect(store.config.save.defaultFormat).toBe('jpg')
      expect(store.config.save.defaultPath).toBe('/screenshots')
      expect(store.config.save.autoCopyToClipboard).toBe(true)
    })

    it('clearScreenshot 应该重置 imageData 和 captureRegion', () => {
      const store = useScreenshotStore()
      store.setImageData(new Uint8Array([1, 2, 3]))
      store.setCaptureRegion({ x: 0, y: 0, width: 100, height: 100 })
      store.clearScreenshot()
      expect(store.imageData).toBeNull()
      expect(store.captureRegion).toBeNull()
    })
  })

  describe('撤销/重做集成', () => {
    it('setCurrentTool 后 clearScreenshot 不影响工具状态', () => {
      const store = useScreenshotStore()
      store.setCurrentTool('rect')
      store.clearScreenshot()
      expect(store.currentTool).toBe('rect')
    })
  })
})

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useScreenshotStore = defineStore('screenshot', () => {
  // Screenshot data
  const imageData = ref<Uint8Array | null>(null)
  const captureRegion = ref<{ x: number; y: number; width: number; height: number } | null>(null)

  // Editor state
  const currentTool = ref<'pencil' | 'rect' | 'circle' | 'arrow' | 'text' | 'mosaic'>('pencil')
  const currentColor = ref('#FF0000')
  const currentLineWidth = ref(2)
  const currentFontSize = ref(16)

  // Configuration
  const config = ref({
    shortcuts: {
      captureFullScreen: 'Ctrl+Shift+S',
      captureRegion: 'Ctrl+Shift+A',
      captureWindow: 'Ctrl+Shift+W'
    },
    save: {
      defaultFormat: 'png' as 'png' | 'jpg',
      defaultPath: '',
      autoCopyToClipboard: false
    },
    editor: {
      defaultColor: '#FF0000',
      defaultLineWidth: 2
    }
  })

  // Actions
  const setImageData = (data: Uint8Array) => {
    imageData.value = data
  }

  const setCaptureRegion = (region: { x: number; y: number; width: number; height: number }) => {
    captureRegion.value = region
  }

  const setCurrentTool = (tool: typeof currentTool.value) => {
    currentTool.value = tool
  }

  const setCurrentColor = (color: string) => {
    currentColor.value = color
  }

  const setCurrentLineWidth = (width: number) => {
    currentLineWidth.value = width
  }

  const setCurrentFontSize = (size: number) => {
    currentFontSize.value = size
  }

  const updateConfig = (newConfig: Partial<typeof config.value>) => {
    config.value = { ...config.value, ...newConfig }
  }

  const clearScreenshot = () => {
    imageData.value = null
    captureRegion.value = null
  }

  return {
    // State
    imageData,
    captureRegion,
    currentTool,
    currentColor,
    currentLineWidth,
    currentFontSize,
    config,

    // Actions
    setImageData,
    setCaptureRegion,
    setCurrentTool,
    setCurrentColor,
    setCurrentLineWidth,
    setCurrentFontSize,
    updateConfig,
    clearScreenshot
  }
})

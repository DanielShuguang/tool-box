import type { Canvas } from 'fabric'

interface FileImportOptions {
  getCanvas: () => Canvas | null
  importFromFile: (canvas: Canvas, file: File, callback: () => void) => Promise<boolean>
  saveToHistory: () => void
}

export function useCanvasImport() {
  const message = useMessage()
  const fileInputRef = ref<HTMLInputElement | null>(null)

  const triggerFileInput = () => {
    fileInputRef.value?.click()
  }

  const handleFileImport = async (event: Event, options: FileImportOptions) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
      const canvas = options.getCanvas()
      if (!canvas) return
      const result = await options.importFromFile(canvas, input.files[0], () => {
        options.saveToHistory()
        message.success('导入成功')
      })
      if (result) {
        message.success('导入成功')
      }
      input.value = ''
    }
  }

  return {
    fileInputRef,
    triggerFileInput,
    handleFileImport
  }
}

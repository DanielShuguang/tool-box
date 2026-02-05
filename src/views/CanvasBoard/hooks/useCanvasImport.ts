import { ref } from 'vue'
import { useMessage } from 'naive-ui'

interface FileImportOptions {
  getCanvas: () => any
  importFromFile: (canvas: any, file: File, callback: () => void) => Promise<boolean>
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
      const result = await options.importFromFile(options.getCanvas(), input.files[0], () => {
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

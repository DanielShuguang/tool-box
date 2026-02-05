import { ref } from 'vue'
import { useMessage } from 'naive-ui'

interface ImageInsertOptions {
  getCanvas: () => any
  insertImageFromFile: (canvas: any, file: File) => Promise<void>
  saveToHistory: () => void
}

interface ImagePasteOptions {
  getCanvas: () => any
  insertImageFromClipboard: (canvas: any) => Promise<void>
  saveToHistory: () => void
}

interface ImageDropOptions {
  getCanvas: () => any
  insertImageFromDrop: (options: {
    canvas: any
    file: File
    dropX: number
    dropY: number
  }) => Promise<void>
  saveToHistory: () => void
}

export function useCanvasImage() {
  const message = useMessage()
  const imageInputRef = ref<HTMLInputElement | null>(null)

  const triggerImageInput = () => {
    imageInputRef.value?.click()
  }

  const handleImageInsert = async (event: Event, options: ImageInsertOptions) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
      try {
        await options.insertImageFromFile(options.getCanvas(), input.files[0])
        options.saveToHistory()
        message.success('图片插入成功')
      } catch (error) {
        message.error((error as Error).message)
      }
      input.value = ''
    }
  }

  const handlePaste = async (options: ImagePasteOptions) => {
    try {
      await options.insertImageFromClipboard(options.getCanvas())
      options.saveToHistory()
      message.success('图片粘贴成功')
    } catch (error) {
      console.error('粘贴失败:', error)
    }
  }

  const handleDrop = async (event: DragEvent, options: ImageDropOptions) => {
    event.preventDefault()
    if (!event.dataTransfer?.files.length) return

    const file = event.dataTransfer.files[0]
    const canvas = options.getCanvas()
    if (!canvas) return

    const pointer = canvas.getPointer(event)
    try {
      await options.insertImageFromDrop({
        canvas,
        file,
        dropX: pointer.x,
        dropY: pointer.y
      })
      options.saveToHistory()
      message.success('图片插入成功')
    } catch (error) {
      message.error((error as Error).message)
    }
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
  }

  return {
    imageInputRef,
    triggerImageInput,
    handleImageInsert,
    handlePaste,
    handleDrop,
    handleDragOver
  }
}

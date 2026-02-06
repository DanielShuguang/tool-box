import { selectExportDirectory } from '@/backend-channel/file-io'
import type { ExportFormat } from '../types'
import type { Canvas, ImageFormat } from 'fabric'

export function useCanvasExport() {
  const message = useMessage()
  const showExportDialog = ref(false)
  const selectedExportFormat = ref<ExportFormat>('png')
  const isExporting = ref(false)

  const openExportDialog = () => {
    showExportDialog.value = true
    selectedExportFormat.value = 'png'
  }

  const closeExportDialog = () => {
    showExportDialog.value = false
    selectedExportFormat.value = 'png'
  }

  const handleExport = async (
    getCanvas: () => Canvas | null,
    getCanvasDataURL: (canvas: Canvas, format: ImageFormat, quality: number) => string,
    getCanvasSVG: (canvas: Canvas) => string
  ) => {
    isExporting.value = true

    try {
      message.info('请选择导出目录...')
      const dirPath = await selectExportDirectory()

      if (!dirPath) {
        message.info('已取消导出')
        return
      }

      const canvas = getCanvas()
      if (!canvas) {
        message.error('画布未初始化')
        return
      }

      const format = selectedExportFormat.value
      const timestamp = Date.now()
      const extension = format === 'jpeg' ? 'jpg' : format
      const filename = `canvas_export_${timestamp}.${extension}`

      let data: string
      if (format === 'svg') {
        data = getCanvasSVG(canvas)
        data = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data)
      } else {
        data = getCanvasDataURL(canvas, format as 'png' | 'jpeg', 0.92)
      }

      const link = document.createElement('a')
      link.download = filename
      link.href = data
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      message.success(`已导出到: ${dirPath}/${filename}`)
      closeExportDialog()
    } catch (error) {
      console.error('导出失败:', error)
      message.error('导出失败，请重试')
    } finally {
      isExporting.value = false
    }
  }

  return {
    showExportDialog,
    selectedExportFormat,
    isExporting,
    openExportDialog,
    closeExportDialog,
    handleExport
  }
}

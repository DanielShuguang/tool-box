/**
 * 画稿文件导入导出 Hook
 *
 * 处理 .draw 格式文件的保存和加载
 */
import { saveBinaryFile, selectImportFile, readBinaryFile } from '@/backend-channel/file-io'
import { packDrawFile, unpackDrawFile, isValidDrawFile } from '../utils/drawFileUtils'
import type { DrawFileMetadata, DrawSaveOptions } from '../types'
import type { Canvas } from 'fabric'

interface UseDrawFileOptions {
  getCanvas: () => Canvas | null
  saveToHistory: () => void
  onLoadComplete?: () => void
}

export function useDrawFile(options: UseDrawFileOptions) {
  const { getCanvas, saveToHistory, onLoadComplete } = options
  const message = useMessage()
  const isExporting = ref(false)
  const isImporting = ref(false)
  const showSaveDialog = ref(false)
  const currentMetadata = ref<Partial<DrawFileMetadata>>({})

  /**
   * 导出画稿文件
   */
  const exportDrawFile = async (saveOptions: DrawSaveOptions) => {
    const canvas = getCanvas()
    if (!canvas) {
      message.error('画布未初始化')
      return null
    }

    isExporting.value = true

    try {
      const canvasJson = JSON.stringify(canvas.toJSON())
      const canvasEl = canvas.upperCanvasEl || canvas.lowerCanvasEl

      if (!canvasEl) {
        message.error('无法获取画布元素')
        return null
      }

      const blob = await packDrawFile({
        canvasJson,
        canvas: canvasEl,
        metadata: {
          canvas: {
            width: saveOptions.width,
            height: saveOptions.height,
            backgroundColor: saveOptions.backgroundColor || '#ffffff'
          }
        }
      })

      const defaultName = saveOptions.title
        ? `${saveOptions.title}.draw`
        : `画稿_${Date.now()}.draw`

      const arrayBuffer = await blob.arrayBuffer()
      const filePath = await saveBinaryFile(new Uint8Array(arrayBuffer), defaultName, [
        { name: '画稿文件', extensions: ['draw'] }
      ])

      if (filePath) {
        message.success(`画稿已保存: ${filePath}`)
        return filePath
      }

      return null
    } catch (error) {
      console.error('导出画稿失败:', error)
      message.error(`导出失败: ${(error as Error).message}`)
      return null
    } finally {
      isExporting.value = false
    }
  }

  /**
   * 导入画稿文件
   */
  const importDrawFile = async (filePath?: string) => {
    isImporting.value = true

    try {
      let fileData: Uint8Array

      if (filePath) {
        fileData = await readBinaryFile(filePath)
      } else {
        const selectedPath = await selectImportFile([{ name: '画稿文件', extensions: ['draw'] }])

        if (!selectedPath) {
          isImporting.value = false
          return false
        }

        fileData = await readBinaryFile(selectedPath)
      }

      const arrayBuffer = new ArrayBuffer(fileData.length)
      new Uint8Array(arrayBuffer).set(fileData)
      const blob = new Blob([arrayBuffer])
      const result = await unpackDrawFile(blob)

      if (!result.success || !result.canvasJson) {
        message.error(result.error || '文件解析失败')
        return false
      }

      const canvas = getCanvas()
      if (!canvas) {
        message.error('画布未初始化')
        return false
      }

      await new Promise<void>((resolve, reject) => {
        try {
          const data = JSON.parse(result.canvasJson!)
          canvas.loadFromJSON(data, () => {
            canvas.renderAll()
            resolve()
          })
        } catch (error) {
          reject(error)
        }
      })

      currentMetadata.value = result.metadata || {}
      saveToHistory()
      onLoadComplete?.()
      message.success('画稿导入成功')

      return true
    } catch (error) {
      console.error('导入画稿失败:', error)
      message.error(`导入失败: ${(error as Error).message}`)
      return false
    } finally {
      isImporting.value = false
    }
  }

  /**
   * 从 File 对象导入画稿
   */
  const importDrawFileFromBlob = async (file: File): Promise<boolean> => {
    if (!isValidDrawFile(file)) {
      message.error('无效的画稿文件格式')
      return false
    }

    isImporting.value = true

    try {
      const blob = new Blob([await file.arrayBuffer()])
      const result = await unpackDrawFile(blob)

      if (!result.success || !result.canvasJson) {
        message.error(result.error || '文件解析失败')
        return false
      }

      const canvas = getCanvas()
      if (!canvas) {
        message.error('画布未初始化')
        return false
      }

      await new Promise<void>((resolve, reject) => {
        try {
          const data = JSON.parse(result.canvasJson!)
          canvas.loadFromJSON(data, () => {
            canvas.renderAll()
            resolve()
          })
        } catch (error) {
          reject(error)
        }
      })

      currentMetadata.value = result.metadata || {}
      saveToHistory()
      onLoadComplete?.()
      message.success('画稿导入成功')

      return true
    } catch (error) {
      console.error('导入画稿失败:', error)
      message.error(`导入失败: ${(error as Error).message}`)
      return false
    } finally {
      isImporting.value = false
    }
  }

  /**
   * 打开保存对话框
   */
  const openSaveDialog = () => {
    showSaveDialog.value = true
  }

  /**
   * 关闭保存对话框
   */
  const closeSaveDialog = () => {
    showSaveDialog.value = false
  }

  return {
    isExporting,
    isImporting,
    showSaveDialog,
    currentMetadata,
    exportDrawFile,
    importDrawFile,
    importDrawFileFromBlob,
    openSaveDialog,
    closeSaveDialog
  }
}

/**
 * 文件操作 Hook
 *
 * 处理文件导入导出功能
 */
// @ts-expect-error Fabric.js 类型声明
import { fabric } from 'fabric'

export function useFileOperations() {
  const getCanvasDataURL = (
    canvas: any,
    format: 'png' | 'jpg' | 'svg' = 'png',
    quality = 1
  ): string => {
    if (!canvas) return ''
    return canvas.toDataURL({
      format,
      quality,
      multiplier: 1
    })
  }

  const getCanvasSVG = (canvas: any): string => {
    if (!canvas) return ''
    return canvas.toSVG()
  }

  const loadFromJSON = (canvas: any, json: string, onComplete?: () => void) => {
    if (!canvas) return
    try {
      const data = JSON.parse(json)
      canvas.loadFromJSON(data, () => {
        canvas.renderAll()
        onComplete?.()
      })
    } catch (error) {
      console.error('Failed to load JSON:', error)
    }
  }

  const exportToFile = async (
    canvas: any,
    format: 'png' | 'jpg' | 'svg',
    onComplete?: () => void
  ) => {
    if (!canvas) return

    try {
      let dataURL: string
      let extension: string

      if (format === 'svg') {
        dataURL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(getCanvasSVG(canvas))
        extension = 'svg'
      } else {
        dataURL = getCanvasDataURL(canvas, format, 0.92)
        extension = format
      }

      const link = document.createElement('a')
      link.download = `canvas_export_${Date.now()}.${extension}`
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      onComplete?.()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const importFromFile = async (
    canvas: any,
    file: File,
    onComplete?: () => void
  ): Promise<boolean> => {
    if (!canvas) return false

    const reader = new FileReader()

    return new Promise(resolve => {
      reader.onload = async e => {
        try {
          const result = e.target?.result
          if (!result) {
            resolve(false)
            return
          }

          if (file.type.includes('svg') || file.name.endsWith('.svg')) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const objects = await (fabric as any).loadSVGFromString(result as string)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const group = await (fabric as any).util.groupSVGElements(objects)
            canvas.add(group)
            canvas.renderAll()
            onComplete?.()
            resolve(true)
          } else {
            fabric.Image.fromURL(result as string, (img: any) => {
              canvas.add(img)
              canvas.renderAll()
              onComplete?.()
              resolve(true)
            })
          }
        } catch {
          resolve(false)
        }
      }

      reader.readAsDataURL(file)
    })
  }

  return {
    getCanvasDataURL,
    getCanvasSVG,
    loadFromJSON,
    exportToFile,
    importFromFile
  }
}

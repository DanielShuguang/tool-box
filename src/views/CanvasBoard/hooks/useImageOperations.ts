/**
 * 图片操作 Hook
 *
 * 处理图片的插入、渲染和操作
 */
import { FabricImage, Canvas } from 'fabric'
import type { ImageInsertOptions, SupportedImageFormat } from '../types'

export function useImageOperations() {
  const supportedFormats: SupportedImageFormat[] = ['png', 'jpeg', 'jpg', 'webp', 'gif', 'bmp']
  const maxImageSize = 4096

  const isImageFormatSupported = (format: string): boolean => {
    return supportedFormats.includes(format.toLowerCase() as SupportedImageFormat)
  }

  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!isImageFormatSupported(extension)) {
      return {
        valid: false,
        error: `不支持的图片格式：${extension}，支持的格式：${supportedFormats.join(', ')}`
      }
    }
    return { valid: true }
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        const result = e.target?.result as string
        resolve(result)
      }
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      reader.readAsDataURL(file)
    })
  }

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = src
    })
  }

  const resizeImageIfNeeded = async (
    src: string,
    maxWidth: number = maxImageSize,
    maxHeight: number = maxImageSize
  ): Promise<string> => {
    const img = await loadImage(src)

    if (img.width <= maxWidth && img.height <= maxHeight) {
      return src
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法创建 canvas 上下文')
    }

    let width = img.width
    let height = img.height

    if (width > maxWidth) {
      height = (height * maxWidth) / width
      width = maxWidth
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height
      height = maxHeight
    }

    canvas.width = width
    canvas.height = height
    ctx.drawImage(img, 0, 0, width, height)

    return canvas.toDataURL('image/png')
  }

  const insertImage = async (
    canvas: Canvas,
    src: string,
    options: ImageInsertOptions = {}
  ): Promise<void> => {
    const resizedSrc = await resizeImageIfNeeded(src, options.maxWidth, options.maxHeight)
    const img = await loadImage(resizedSrc)

    const fabricImage = new FabricImage(img, {
      left: options.x ?? canvas.width / 2 - img.width / 2,
      top: options.y ?? canvas.height / 2 - img.height / 2,
      width: img.width,
      height: img.height,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      originX: 'center',
      originY: 'center'
    })

    canvas.add(fabricImage)
    canvas.setActiveObject(fabricImage)
    canvas.renderAll()
  }

  const insertImageFromFile = async (
    canvas: Canvas,
    file: File,
    options: ImageInsertOptions = {}
  ): Promise<void> => {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const base64 = await readFileAsBase64(file)
    await insertImage(canvas, base64, options)
  }

  const insertImageFromClipboard = async (
    canvas: Canvas,
    options: ImageInsertOptions = {}
  ): Promise<void> => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const file = new File([blob], 'clipboard-image.png', { type })
            await insertImageFromFile(canvas, file, options)
            return
          }
        }
      }
      throw new Error('剪贴板中没有图片')
    } catch (error) {
      throw new Error('无法读取剪贴板：' + (error as Error).message)
    }
  }

  const insertImageFromDrop = async (params: {
    canvas: Canvas
    file: File
    dropX: number
    dropY: number
    options?: ImageInsertOptions
  }): Promise<void> => {
    const { canvas, file, dropX, dropY, options = {} } = params
    const validation = validateImageFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const base64 = await readFileAsBase64(file)
    await insertImage(canvas, base64, {
      ...options,
      x: dropX,
      y: dropY
    })
  }

  return {
    supportedFormats,
    maxImageSize,
    isImageFormatSupported,
    validateImageFile,
    readFileAsBase64,
    insertImage,
    insertImageFromFile,
    insertImageFromClipboard,
    insertImageFromDrop
  }
}

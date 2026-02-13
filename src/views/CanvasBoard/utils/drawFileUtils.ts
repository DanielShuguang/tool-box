/**
 * 画稿文件打包/解包工具
 *
 * 使用 JSZip 处理 .draw 文件的创建和解析
 */
import JSZip from 'jszip'
import type { DrawFileMetadata, DrawImportResult, DrawAssetInfo } from '../types'

const MANIFEST_FILE = 'manifest.json'
const CANVAS_FILE = 'canvas.json'
const THUMBNAIL_FILE = 'thumbnail.png'
const ASSETS_DIR = 'assets'

const THUMBNAIL_WIDTH = 200
const THUMBNAIL_HEIGHT = 150

/**
 * 生成缩略图
 */
async function generateThumbnail(
  canvas: HTMLCanvasElement,
  width: number = THUMBNAIL_WIDTH,
  height: number = THUMBNAIL_HEIGHT
): Promise<Blob> {
  const thumbCanvas = document.createElement('canvas')
  thumbCanvas.width = width
  thumbCanvas.height = height
  const ctx = thumbCanvas.getContext('2d')

  if (!ctx) {
    throw new Error('无法创建缩略图画布上下文')
  }

  const scale = Math.min(width / canvas.width, height / canvas.height)
  const scaledWidth = canvas.width * scale
  const scaledHeight = canvas.height * scale
  const x = (width - scaledWidth) / 2
  const y = (height - scaledHeight) / 2

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight)

  return new Promise((resolve, reject) => {
    thumbCanvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('生成缩略图失败'))
        }
      },
      'image/png',
      0.9
    )
  })
}

/**
 * 从 Base64 数据 URL 提取图片信息
 */
function parseBase64Image(dataUrl: string): { mime: string; base64: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return { mime: match[1], base64: match[2] }
}

/**
 * 从 Fabric.js JSON 中提取图片资源
 */
function extractImageAssets(canvasJson: string): {
  json: string
  assets: Map<string, { data: string; originalName: string }>
} {
  const assets = new Map<string, { data: string; originalName: string }>()
  let assetCounter = 0

  const data = JSON.parse(canvasJson)

  const processObject = (obj: Record<string, unknown>) => {
    if (obj.type === 'image' && typeof obj.src === 'string' && obj.src.startsWith('data:')) {
      const parsed = parseBase64Image(obj.src)
      if (parsed) {
        const ext = parsed.mime.split('/')[1] || 'png'
        const assetId = `img_${String(assetCounter++).padStart(3, '0')}`
        const filename = `${assetId}.${ext}`

        assets.set(assetId, {
          data: obj.src as string,
          originalName: `image_${assetCounter}.${ext}`
        })

        obj.src = `assets://${assetId}`
        obj._assetId = assetId
        obj._assetFilename = filename
      }
    }

    if (Array.isArray(obj.objects)) {
      obj.objects.forEach(processObject)
    }
  }

  if (data.objects) {
    data.objects.forEach(processObject)
  }

  return { json: JSON.stringify(data), assets }
}

/**
 * 将资源引用还原为 Base64 数据
 */
async function restoreImageAssets(canvasJson: string, assets: Map<string, Blob>): Promise<string> {
  const data = JSON.parse(canvasJson)

  const processObject = async (obj: Record<string, unknown>) => {
    if (obj.type === 'image' && typeof obj.src === 'string' && obj.src.startsWith('assets://')) {
      const assetId = obj.src.replace('assets://', '')
      const blob = assets.get(assetId)

      if (blob) {
        obj.src = await blobToBase64(blob)
      }
    }

    if (Array.isArray(obj.objects)) {
      for (const child of obj.objects) {
        await processObject(child)
      }
    }
  }

  if (data.objects) {
    for (const obj of data.objects) {
      await processObject(obj)
    }
  }

  return JSON.stringify(data)
}

/**
 * Blob 转 Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 打包画稿文件
 */
export async function packDrawFile(params: {
  canvasJson: string
  canvas: HTMLCanvasElement
  metadata: Omit<DrawFileMetadata, 'version' | 'format' | 'created' | 'modified' | 'assets'>
}): Promise<Blob> {
  const { canvasJson, canvas, metadata } = params
  const zip = new JSZip()
  const now = Date.now()

  const { json: processedJson, assets } = extractImageAssets(canvasJson)

  const assetInfos: DrawAssetInfo[] = []
  const assetsFolder = zip.folder(ASSETS_DIR)

  if (assetsFolder) {
    for (const [assetId, assetData] of assets) {
      const parsed = parseBase64Image(assetData.data)
      if (parsed) {
        const ext = parsed.mime.split('/')[1] || 'png'
        const filename = `${assetId}.${ext}`

        const binaryString = atob(parsed.base64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        assetsFolder.file(filename, bytes)
        assetInfos.push({
          id: assetId,
          filename,
          originalName: assetData.originalName
        })
      }
    }
  }

  const manifest: DrawFileMetadata = {
    version: '1.0.0',
    format: 'canvas-draw',
    created: now,
    modified: now,
    canvas: metadata.canvas,
    assets: assetInfos
  }

  zip.file(MANIFEST_FILE, JSON.stringify(manifest, null, 2))
  zip.file(CANVAS_FILE, processedJson)

  const thumbnail = await generateThumbnail(canvas)
  zip.file(THUMBNAIL_FILE, thumbnail)

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

/**
 * 解包画稿文件
 */
export async function unpackDrawFile(blob: Blob): Promise<DrawImportResult> {
  try {
    const zip = await JSZip.loadAsync(blob)

    const manifestFile = zip.file(MANIFEST_FILE)
    if (!manifestFile) {
      return {
        success: false,
        metadata: null,
        canvasJson: null,
        assets: new Map(),
        error: '缺少 manifest.json 文件'
      }
    }

    const manifestContent = await manifestFile.async('string')
    const metadata = JSON.parse(manifestContent) as DrawFileMetadata

    if (metadata.format !== 'canvas-draw') {
      return {
        success: false,
        metadata: null,
        canvasJson: null,
        assets: new Map(),
        error: '不支持的文件格式'
      }
    }

    const canvasFile = zip.file(CANVAS_FILE)
    if (!canvasFile) {
      return {
        success: false,
        metadata: null,
        canvasJson: null,
        assets: new Map(),
        error: '缺少 canvas.json 文件'
      }
    }

    const canvasJson = await canvasFile.async('string')

    const assets = new Map<string, Blob>()
    const assetsFolder = zip.folder(ASSETS_DIR)

    if (assetsFolder && metadata.assets.length > 0) {
      for (const assetInfo of metadata.assets) {
        const assetFile = assetsFolder.file(assetInfo.filename)
        if (assetFile) {
          const assetBlob = await assetFile.async('blob')
          assets.set(assetInfo.id, assetBlob)
        }
      }
    }

    const restoredJson = await restoreImageAssets(canvasJson, assets)

    return {
      success: true,
      metadata,
      canvasJson: restoredJson,
      assets
    }
  } catch (error) {
    return {
      success: false,
      metadata: null,
      canvasJson: null,
      assets: new Map(),
      error: `文件解析失败: ${(error as Error).message}`
    }
  }
}

/**
 * 验证画稿文件格式
 */
export function isValidDrawFile(file: File): boolean {
  return file.name.endsWith('.draw') || file.type === 'application/zip'
}

/**
 * 获取画稿文件缩略图
 */
export async function getDrawThumbnail(blob: Blob): Promise<Blob | null> {
  try {
    const zip = await JSZip.loadAsync(blob)
    const thumbnailFile = zip.file(THUMBNAIL_FILE)
    if (thumbnailFile) {
      return await thumbnailFile.async('blob')
    }
    return null
  } catch {
    return null
  }
}

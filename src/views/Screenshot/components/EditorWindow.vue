<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Canvas, FabricImage } from 'fabric'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { useMessage } from 'naive-ui'

interface CanvasAction {
  json: any
}

const message = useMessage()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let fabricCanvas: Canvas | null = null
const undoStack = ref<CanvasAction[]>([])
const redoStack = ref<CanvasAction[]>([])

const currentTool = ref<'pencil' | 'rect' | 'circle' | 'arrow' | 'text' | 'mosaic'>('pencil')
const currentColor = ref('#FF0000')
const currentLineWidth = ref(2)
let saveHandler: (() => void) | null = null
let unlisten: (() => void) | null = null

function saveState() {
  if (!fabricCanvas) return
  const json = fabricCanvas.toJSON()
  undoStack.value.push({ json })
  redoStack.value = []
}

function loadState(action: CanvasAction) {
  if (!fabricCanvas) return
  fabricCanvas.loadFromJSON(action.json, () => {
    fabricCanvas!.renderAll()
  })
}

const loadImage = async () => {
  if (!canvasRef.value || fabricCanvas) return

  try {
    const data = await invoke<number[]>('get_screenshot_data')
    if (!data || data.length === 0) return

    fabricCanvas = new Canvas(canvasRef.value)
    const imageData = new Uint8Array(data)
    const blob = new Blob([imageData.buffer as ArrayBuffer], { type: 'image/png' })
    const url = URL.createObjectURL(blob)

    try {
      const img = await FabricImage.fromURL(url)
      const canvasWidth = Math.min(Math.round(img.width!) + 40, 1200)
      const canvasHeight = Math.min(Math.round(img.height!) + 40, 900)
      fabricCanvas.setDimensions({ width: canvasWidth, height: canvasHeight })

      const scaleX = (canvasWidth - 40) / img.width!
      const scaleY = (canvasHeight - 40) / img.height!
      const scale = Math.min(scaleX, scaleY, 1)
      img.set({ left: 20, top: 20, scaleX: scale, scaleY: scale })
      fabricCanvas.add(img)
      fabricCanvas.renderAll()

      saveHandler = () => saveState()
      fabricCanvas.on('object:modified', saveHandler)
      saveState()
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch (e) {
    console.error('加载截图数据失败:', e)
  }
}

onMounted(async () => {
  // 注册事件监听
  unlisten = await listen('screenshot-ready', () => loadImage())

  // 先尝试直接加载一次
  await loadImage()

  // 如果还没加载成功，开始轮询
  if (!fabricCanvas) {
    let retries = 0
    const poll = () => {
      if (fabricCanvas || retries >= 10) return
      retries++
      loadImage()
      setTimeout(poll, 200)
    }
    setTimeout(poll, 300)
  }
})

onUnmounted(() => {
  if (fabricCanvas && saveHandler) fabricCanvas.off('object:modified', saveHandler)
  unlisten?.()
})

function getImageData(): Uint8Array {
  if (!fabricCanvas) return new Uint8Array()
  const dataUrl = fabricCanvas.toDataURL({ format: 'png', multiplier: 1 })
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  return bytes
}

const handleSave = async () => {
  const imageData = getImageData()
  if (imageData.length === 0) {
    message.error('没有截图数据')
    return
  }
  try {
    const filePath = await save({
      defaultPath: `screenshot-${Date.now()}.png`,
      filters: [
        { name: 'PNG 图片', extensions: ['png'] },
        { name: 'JPEG 图片', extensions: ['jpg', 'jpeg'] }
      ]
    })
    if (filePath) {
      await writeFile(filePath, imageData as Uint8Array)
      message.success('截图已保存')
    }
  } catch (e) {
    message.error(`保存失败: ${e}`)
  }
}

const handleCopy = async () => {
  const imageData = getImageData()
  if (imageData.length === 0) {
    message.error('没有截图数据')
    return
  }
  try {
    const blob = new Blob([imageData.buffer as ArrayBuffer], { type: 'image/png' })
    const img = new Image()
    const url = URL.createObjectURL(blob)

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建 canvas'))
          return
        }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(async (b) => {
          if (!b) {
            reject(new Error('无法转换图片'))
            return
          }
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': b })
            ])
            resolve()
          } catch (err) {
            reject(err)
          }
        }, 'image/png')
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = url
    })

    URL.revokeObjectURL(url)
    message.success('截图已复制到剪贴板')
  } catch (e) {
    message.error(`复制失败: ${e}`)
  }
}

const handleClose = async () => {
  await getCurrentWindow().close()
}

const handleUndo = () => {
  if (undoStack.value.length <= 1) return
  const current = undoStack.value.pop()!
  redoStack.value.push(current)
  const prev = undoStack.value[undoStack.value.length - 1]
  loadState(prev)
}

const handleRedo = () => {
  if (redoStack.value.length === 0) return
  const next = redoStack.value.pop()!
  undoStack.value.push(next)
  loadState(next)
}
</script>

<template>
  <div class="editor-window">
    <div class="editor-toolbar">
      <n-space>
        <n-button
          data-testid="tool-pencil"
          size="small"
          :type="currentTool === 'pencil' ? 'primary' : 'default'"
          @click="currentTool = 'pencil'"
        >
          画笔
        </n-button>
        <n-button
          data-testid="tool-rect"
          size="small"
          :type="currentTool === 'rect' ? 'primary' : 'default'"
          @click="currentTool = 'rect'"
        >
          矩形
        </n-button>
        <n-button
          data-testid="tool-circle"
          size="small"
          :type="currentTool === 'circle' ? 'primary' : 'default'"
          @click="currentTool = 'circle'"
        >
          圆形
        </n-button>
        <n-button
          data-testid="tool-arrow"
          size="small"
          :type="currentTool === 'arrow' ? 'primary' : 'default'"
          @click="currentTool = 'arrow'"
        >
          箭头
        </n-button>
        <n-button
          data-testid="tool-text"
          size="small"
          :type="currentTool === 'text' ? 'primary' : 'default'"
          @click="currentTool = 'text'"
        >
          文字
        </n-button>
        <n-button
          data-testid="tool-mosaic"
          size="small"
          :type="currentTool === 'mosaic' ? 'primary' : 'default'"
          @click="currentTool = 'mosaic'"
        >
          马赛克
        </n-button>
      </n-space>

      <n-space>
        <n-button data-testid="btn-undo" size="small" @click="handleUndo">撤销</n-button>
        <n-button data-testid="btn-redo" size="small" @click="handleRedo">重做</n-button>
      </n-space>
    </div>

    <div class="editor-canvas">
      <canvas ref="canvasRef" data-testid="editor-canvas" />
    </div>

    <div class="editor-properties">
      <n-space vertical>
        <n-color-picker data-testid="color-picker" v-model:value="currentColor" />
        <n-input-number data-testid="line-width-input" v-model:value="currentLineWidth" :min="1" :max="10" />
      </n-space>
    </div>

    <div class="editor-actions">
      <n-button data-testid="btn-save" type="primary" @click="handleSave">保存</n-button>
      <n-button data-testid="btn-copy" @click="handleCopy">复制</n-button>
      <n-button data-testid="btn-close-editor" @click="handleClose">关闭</n-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.editor-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: #f5f5f5;
}

.editor-canvas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;

  canvas {
    border: 1px solid #ddd;
  }
}

.editor-properties {
  padding: 8px;
  background: #f5f5f5;
}

.editor-actions {
  display: flex;
  gap: 8px;
  padding: 8px;
  justify-content: flex-end;
}
</style>

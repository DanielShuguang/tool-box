<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { useMessage } from 'naive-ui'

const message = useMessage()
const previewImageUrl = ref('')
const isAlwaysOnTop = ref(true)
const imageData = ref<Uint8Array | null>(null)
let loaded = false
let unlisten: (() => void) | null = null

const loadScreenshot = async () => {
  if (loaded) return
  try {
    const data = await invoke<number[]>('get_screenshot_data')
    if (!data || data.length === 0) return
    loaded = true
    imageData.value = new Uint8Array(data)
    const blob = new Blob([imageData.value.buffer as ArrayBuffer], { type: 'image/png' })
    if (previewImageUrl.value) URL.revokeObjectURL(previewImageUrl.value)
    previewImageUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    console.error('加载截图数据失败:', e)
  }
}

// 兜底：轮询拉取，最多重试 10 次（共 2s）
onMounted(async () => {
  // 注册事件监听
  unlisten = await listen('screenshot-ready', () => loadScreenshot())

  // 先尝试直接加载一次
  await loadScreenshot()

  // 如果还没加载成功，开始轮询
  if (!loaded) {
    let retries = 0
    const poll = () => {
      if (loaded || retries >= 10) return
      retries++
      loadScreenshot()
      setTimeout(poll, 200)
    }
    setTimeout(poll, 300)
  }
})

onUnmounted(() => {
  if (previewImageUrl.value) URL.revokeObjectURL(previewImageUrl.value)
  unlisten?.()
})

const handleEdit = async () => {
  try {
    await invoke('create_editor_window')
    await getCurrentWindow().close()
  } catch (e) {
    message.error(`打开编辑器失败: ${e}`)
  }
}

const handleSave = async () => {
  if (!imageData.value) {
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
      await writeFile(filePath, imageData.value as Uint8Array)
      message.success('截图已保存')
    }
  } catch (e) {
    message.error(`保存失败: ${e}`)
  }
}

const handleCopy = async () => {
  if (!imageData.value) {
    message.error('没有截图数据')
    return
  }
  try {
    // 使用 Canvas 将图片数据复制到剪贴板
    const blob = new Blob([imageData.value.buffer as ArrayBuffer], { type: 'image/png' })
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
        canvas.toBlob(async b => {
          if (!b) {
            reject(new Error('无法转换图片'))
            return
          }
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })])
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

const toggleAlwaysOnTop = async () => {
  isAlwaysOnTop.value = !isAlwaysOnTop.value
  await getCurrentWindow().setAlwaysOnTop(isAlwaysOnTop.value)
}
</script>

<template>
  <div class="preview-window">
    <div class="preview-header" data-tauri-drag-region>
      <n-button data-testid="btn-toggle-pin" size="small" @click.stop="toggleAlwaysOnTop">
        {{ isAlwaysOnTop ? '取消置顶' : '置顶' }}
      </n-button>
      <n-button data-testid="btn-close-preview" size="small" @click.stop="handleClose"
        >关闭</n-button
      >
    </div>

    <div class="preview-content">
      <img
        v-if="previewImageUrl"
        :src="previewImageUrl"
        class="preview-image"
        data-testid="preview-image" />
      <div v-else class="placeholder" data-testid="preview-placeholder">等待截图...</div>
    </div>

    <div class="preview-actions">
      <n-button data-testid="btn-edit" type="primary" size="small" @click="handleEdit"
        >编辑</n-button
      >
      <n-button data-testid="btn-save" size="small" @click="handleSave">保存</n-button>
      <n-button data-testid="btn-copy" size="small" @click="handleCopy">复制</n-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preview-window {
  width: 100%;
  height: 100vh;
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: #f5f5f5;
  cursor: grab;
  flex-shrink: 0;
}

.preview-content {
  flex: 1;
  padding: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  .preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .placeholder {
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    color: #999;
  }
}

.preview-actions {
  display: flex;
  gap: 8px;
  padding: 8px;
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>

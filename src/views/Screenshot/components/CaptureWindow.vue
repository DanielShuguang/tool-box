<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'

const startX = ref(0)
const startY = ref(0)
const endX = ref(0)
const endY = ref(0)
const isDragging = ref(false)

// 透明窗口需要 HTML/body 背景透明
onMounted(() => {
  document.documentElement.style.background = 'transparent'
  document.body.style.background = 'transparent'
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.documentElement.style.background = ''
  document.body.style.background = ''
  window.removeEventListener('keydown', handleKeyDown)
})

const cancel = () => getCurrentWindow().close()

const handleMouseDown = (e: MouseEvent) => {
  startX.value = e.clientX
  startY.value = e.clientY
  endX.value = e.clientX
  endY.value = e.clientY
  isDragging.value = true
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  endX.value = e.clientX
  endY.value = e.clientY
}

const handleMouseUp = async () => {
  if (!isDragging.value) return
  isDragging.value = false

  const x = Math.min(startX.value, endX.value)
  const y = Math.min(startY.value, endY.value)
  const width = Math.abs(endX.value - startX.value)
  const height = Math.abs(endY.value - startY.value)

  if (width < 5 || height < 5) {
    cancel()
    return
  }

  try {
    // 1. 区域截图
    const data = await invoke<number[]>('capture_region', { x, y, width, height })
    // 2. 先打开预览窗口（必须在关闭截图窗口前执行，否则 JS 上下文会销毁）
    await invoke('create_preview_window', { imageData: Array.from(data) })
    // 3. 关闭截图窗口
    await getCurrentWindow().close()
  } catch {
    cancel()
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') cancel()
}
</script>

<template>
  <div
    class="capture-window"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp">
    <div
      v-if="isDragging"
      class="selection-box"
      :style="{
        left: Math.min(startX, endX) + 'px',
        top: Math.min(startY, endY) + 'px',
        width: Math.abs(endX - startX) + 'px',
        height: Math.abs(endY - startY) + 'px'
      }" />
  </div>
</template>

<style scoped lang="scss">
.capture-window {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
  cursor: crosshair;
  z-index: 9999;
}

.selection-box {
  position: absolute;
  border: 2px dashed #18a058;
  background: rgba(24, 160, 88, 0.1);
}
</style>

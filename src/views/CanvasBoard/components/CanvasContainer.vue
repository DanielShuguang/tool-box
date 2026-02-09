<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const emit = defineEmits<{
  (e: 'ready', refs: { canvas: HTMLCanvasElement; container: HTMLDivElement }): void
  (e: 'pan-start'): void
  (e: 'pan', dx: number, dy: number): void
  (e: 'pan-end'): void
  (e: 'wheel', delta: number): void
}>()

let lastPanX = 0
let lastPanY = 0
let isMouseDown = false

const canvasRef = useTemplateRef('canvas')
const containerRef = useTemplateRef('container')
const isPanning = ref(false)

const isInputElement = (target: EventTarget | null): boolean => {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === ' ' && !e.repeat) {
    if (isInputElement(e.target)) {
      return
    }
    e.preventDefault()
    isPanning.value = true
    emit('pan-start')
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key === ' ') {
    e.preventDefault()
    if (isPanning.value) {
      isPanning.value = false
      emit('pan-end')
    }
  }
}

const handleDomMouseDown = (e: MouseEvent) => {
  if (!isPanning.value) {
    return
  }
  isMouseDown = true
  lastPanX = e.clientX
  lastPanY = e.clientY
}

const handleDomMouseMove = (e: MouseEvent) => {
  if (!isMouseDown) return
  const dx = e.clientX - lastPanX
  const dy = e.clientY - lastPanY
  if (dx !== 0 || dy !== 0) {
    emit('pan', dx, dy)
  }
  lastPanX = e.clientX
  lastPanY = e.clientY
}

const handleDomMouseUp = () => {
  if (isMouseDown) {
    isMouseDown = false
  }
  lastPanX = 0
  lastPanY = 0
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -1 : 1
  emit('wheel', delta)
}

onMounted(() => {
  if (canvasRef.value !== undefined && containerRef.value !== undefined) {
    emit('ready', {
      canvas: canvasRef.value as HTMLCanvasElement,
      container: containerRef.value as HTMLDivElement
    })
  }
  window.addEventListener('mousedown', handleDomMouseDown)
  window.addEventListener('mousemove', handleDomMouseMove)
  window.addEventListener('mouseup', handleDomMouseUp)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleDomMouseDown)
  window.removeEventListener('mousemove', handleDomMouseMove)
  window.removeEventListener('mouseup', handleDomMouseUp)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (containerRef.value) {
    containerRef.value.removeEventListener('wheel', handleWheel)
  }
})

watch(
  () => containerRef.value,
  (newRef, oldRef) => {
    if (oldRef) {
      oldRef.removeEventListener('wheel', handleWheel)
    }
    if (newRef) {
      newRef.addEventListener('wheel', handleWheel, { passive: false })
    }
  },
  { immediate: true }
)
</script>

<template>
  <div
    ref="container"
    class="canvas-container flex-1 bg-[#f0f0f0] overflow-hidden relative"
    :class="{ 'cursor-grab': isPanning }">
    <canvas ref="canvas" />
    <div class="absolute bottom-[10px] left-[10px] text-[12px] text-[--text-color-secondary]">
      提示：使用空格+拖拽平移画布，滚轮缩放
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  cursor: default;
}

.canvas-container.cursor-grab {
  cursor: grab;
}

.canvas-container :deep(canvas) {
  display: block;
}
</style>

/**
 * 画布核心操作 Hook
 *
 * 处理画布初始化、事件绑定、缩放和平移等基础功能
 */
import { ref, shallowRef, onUnmounted } from 'vue'
import { Canvas } from 'fabric'
import type { CanvasConfig } from '../types'

export function useCanvasCore() {
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null)
  const canvasInstance = shallowRef<Canvas | null>(null)
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  const zoom = ref(1)
  const panOffset = ref({ x: 0, y: 0 })
  const isPanning = ref(false)

  let isInternalChange = false

  const initCanvas = (container: HTMLDivElement, canvasElement: HTMLCanvasElement) => {
    containerRef.value = container
    canvasRef.value = canvasElement

    const rect = container.getBoundingClientRect()
    const config: CanvasConfig = {
      width: rect.width,
      height: rect.height,
      backgroundColor: '#ffffff'
    }

    const canvas = new Canvas(canvasElement, {
      width: config.width,
      height: config.height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true
    })

    canvasInstance.value = canvas
    setupResizeHandler()
    canvas.on('mouse:wheel', handleWheel)

    return canvas
  }

  const setupResizeHandler = () => {
    window.addEventListener('resize', handleResize)
  }

  const handleWheel = (opt: any) => {
    const delta = opt.e.deltaY
    if (delta > 0) {
      zoomOut()
    } else {
      zoomIn()
    }
    opt.e.preventDefault()
    opt.e.stopPropagation()
  }

  const handleResize = () => {
    if (!containerRef.value || !canvasInstance.value) return
    const rect = containerRef.value.getBoundingClientRect()
    canvasInstance.value.setDimensions({
      width: rect.width,
      height: rect.height
    })
    canvasInstance.value.renderAll()
  }

  const getCanvas = () => canvasInstance.value
  const getContainer = () => containerRef.value

  const zoomIn = () => {
    zoom.value = Math.min(zoom.value * 1.1, 5)
    canvasInstance.value?.setZoom(zoom.value)
    canvasInstance.value?.renderAll()
  }

  const zoomOut = () => {
    zoom.value = Math.max(zoom.value / 1.1, 0.1)
    canvasInstance.value?.setZoom(zoom.value)
    canvasInstance.value?.renderAll()
  }

  const resetZoom = () => {
    zoom.value = 1
    panOffset.value = { x: 0, y: 0 }
    canvasInstance.value?.setZoom(1)
    canvasInstance.value?.setViewportTransform([1, 0, 0, 1, 0, 0])
    canvasInstance.value?.renderAll()
  }

  const setPanning = (panning: boolean) => {
    isPanning.value = panning
  }

  const handlePanWithDelta = (dx: number, dy: number) => {
    if (!isPanning.value) return

    panOffset.value.x += dx
    panOffset.value.y += dy
    const vpt = canvasInstance.value?.viewportTransform
    if (vpt) {
      vpt[4] += dx
      vpt[5] += dy
      canvasInstance.value?.setViewportTransform(vpt)
    }
  }

  const setInternalChange = (value: boolean) => {
    isInternalChange = value
  }

  const isInternalChangeState = () => isInternalChange

  const dispose = () => {
    window.removeEventListener('resize', handleResize)
    canvasInstance.value?.off('mouse:wheel', handleWheel)
    canvasInstance.value?.dispose()
  }

  onUnmounted(() => {
    dispose()
  })

  return {
    canvasRef,
    canvasInstance,
    containerRef,
    zoom,
    panOffset,
    isPanning,
    initCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
    setPanning,
    handlePanWithDelta,
    getCanvas,
    getContainer,
    setInternalChange,
    isInternalChangeState,
    dispose
  }
}

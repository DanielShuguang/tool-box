/**
 * 绘图工具 Hook
 *
 * 处理各种图形工具的创建和绘制逻辑
 */
import { ref } from 'vue'
// @ts-expect-error Fabric.js 类型声明
import { fabric } from 'fabric'
import type { DrawingTool, ObjectProperties } from '../types'

interface StartDrawingParams {
  x: number
  y: number
  canvas: any
  properties: ObjectProperties
}

interface CreateShapeParams {
  tool: DrawingTool
  x: number
  y: number
  properties: ObjectProperties
}

interface UpdateShapeParams {
  shape: any
  tool: DrawingTool
  left: number
  top: number
  width: number
  height: number
}

export function useDrawingTools() {
  const currentTool = ref<DrawingTool>('select')
  const isDrawing = ref(false)
  const startPoint = ref<{ x: number; y: number } | null>(null)

  const setTool = (tool: DrawingTool) => {
    currentTool.value = tool
  }

  const startDrawing = ({ x, y, canvas, properties }: StartDrawingParams) => {
    isDrawing.value = true
    startPoint.value = { x, y }

    if (toolRequiresDrawingMode(currentTool.value)) {
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush.color = properties.stroke
      canvas.freeDrawingBrush.width = properties.strokeWidth
      return
    }

    const newObject = createShape({
      tool: currentTool.value,
      x,
      y,
      properties
    })
    if (newObject) {
      canvas.add(newObject)
      canvas.setActiveObject(newObject)
    }
  }

  const stopDrawing = (canvas: any, properties: ObjectProperties) => {
    if (toolRequiresDrawingMode(currentTool.value)) {
      canvas.isDrawingMode = false
      isDrawing.value = false
      return
    }

    if (isDrawing.value) {
      const activeObject = canvas.getActiveObject()
      if (activeObject) {
        activeObject.set({
          fill: properties.fill,
          stroke: properties.stroke,
          strokeWidth: properties.strokeWidth,
          opacity: properties.opacity,
          strokeDashArray: properties.strokeDashArray
        })
      }
    }

    isDrawing.value = false
    startPoint.value = null

    if (currentTool.value !== 'select') {
      setTool('select')
    }
  }

  const updateDrawing = (x: number, y: number, canvas: any) => {
    if (!isDrawing.value || !startPoint.value) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject || currentTool.value === 'path') return

    if (currentTool.value === 'line') {
      activeObject.set({ x2: x, y2: y })
    } else {
      const width = Math.abs(x - startPoint.value.x)
      const height = Math.abs(y - startPoint.value.y)
      const left = Math.min(x, startPoint.value.x)
      const top = Math.min(y, startPoint.value.y)

      updateShape({
        shape: activeObject,
        tool: currentTool.value,
        left,
        top,
        width,
        height
      })
    }
    activeObject.setCoords()
    canvas.renderAll()
  }

  const toolRequiresDrawingMode = (tool: DrawingTool): boolean => {
    return tool === 'path'
  }

  const createShape = ({ tool, x, y, properties }: CreateShapeParams): any => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let shape: any = null

    switch (tool) {
      case 'rect':
        shape = new (fabric as any).Rect({
          left: x,
          top: y,
          width: 0,
          height: 0,
          fill: properties.fill,
          stroke: properties.stroke,
          strokeWidth: properties.strokeWidth,
          opacity: properties.opacity,
          strokeDashArray: properties.strokeDashArray
        })
        break

      case 'circle':
        shape = new (fabric as any).Circle({
          left: x,
          top: y,
          radius: 0,
          fill: properties.fill,
          stroke: properties.stroke,
          strokeWidth: properties.strokeWidth,
          opacity: properties.opacity,
          strokeDashArray: properties.strokeDashArray,
          originX: 'center',
          originY: 'center'
        })
        break

      case 'ellipse':
        shape = new (fabric as any).Ellipse({
          left: x,
          top: y,
          rx: 0,
          ry: 0,
          fill: properties.fill,
          stroke: properties.stroke,
          strokeWidth: properties.strokeWidth,
          opacity: properties.opacity,
          strokeDashArray: properties.strokeDashArray,
          originX: 'center',
          originY: 'center'
        })
        break

      case 'line':
        shape = new (fabric as any).Line([x, y, x, y], {
          stroke: properties.stroke,
          strokeWidth: properties.strokeWidth,
          strokeDashArray: properties.strokeDashArray,
          opacity: properties.opacity
        })
        break

      case 'polygon':
        const sideCount = 6
        const points: any[] = []
        for (let i = 0; i < sideCount; i++) {
          points.push({ x, y })
        }
        shape = new (fabric as any).Polygon(points, {
          left: x,
          top: y,
          fill: properties.fill,
          stroke: properties.stroke,
          strokeWidth: properties.strokeWidth,
          opacity: properties.opacity,
          strokeDashArray: properties.strokeDashArray
        })
        break

      case 'text':
        shape = new (fabric as any).IText('双击编辑文字', {
          left: x,
          top: y,
          fontSize: 20,
          fill: properties.fill,
          stroke: properties.stroke,
          strokeWidth: properties.strokeWidth,
          opacity: properties.opacity
        })
        break
    }

    return shape
  }

  const updateShape = ({ shape, tool, left, top, width, height }: UpdateShapeParams) => {
    switch (tool) {
      case 'rect':
        shape.set({ left, top, width, height })
        break

      case 'circle':
        const circleRadius = Math.min(width, height) / 2
        shape.set({
          left: left + circleRadius,
          top: top + circleRadius,
          radius: circleRadius
        })
        break

      case 'ellipse':
        shape.set({
          left,
          top,
          rx: width / 2,
          ry: height / 2
        })
        break

      case 'polygon':
        const sideCount = 6
        const points: any[] = []
        const centerX = left + width / 2
        const centerY = top + height / 2
        const maxRadius = Math.min(width, height) / 2
        for (let i = 0; i < sideCount; i++) {
          const angle = (i * 2 * Math.PI) / sideCount - Math.PI / 2
          points.push({
            x: centerX + maxRadius * Math.cos(angle),
            y: centerY + maxRadius * Math.sin(angle)
          })
        }
        shape.set({ points })
        break
    }
  }

  const resetDrawingState = () => {
    isDrawing.value = false
    startPoint.value = null
  }

  return {
    currentTool,
    isDrawing,
    startPoint,
    setTool,
    startDrawing,
    stopDrawing,
    updateDrawing,
    resetDrawingState
  }
}

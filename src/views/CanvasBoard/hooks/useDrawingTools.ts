/**
 * 绘图工具 Hook
 *
 * 处理各种图形工具的创建和绘制逻辑
 */
import { Circle, Ellipse, IText, Line, Rect, FabricObject, Canvas } from 'fabric'
import type { DrawingTool, ObjectProperties } from '../types'

interface CreateShapeParams {
  tool: DrawingTool
  x: number
  y: number
  properties: ObjectProperties
}

interface UpdateShapeParams {
  shape: FabricObject
  tool: DrawingTool
  left: number
  top: number
  width: number
  height: number
}

interface StartDrawingParams {
  x: number
  y: number
  canvas: Canvas | null
  properties: ObjectProperties
}

export function useDrawingTools() {
  const currentTool = ref<DrawingTool>('select')
  const isDrawing = ref(false)
  const startPoint = ref<{ x: number; y: number } | null>(null)

  const setTool = (tool: DrawingTool) => {
    currentTool.value = tool
  }

  const startDrawing = ({ x, y, canvas, properties }: StartDrawingParams) => {
    if (!canvas) return

    // 选择工具和填色工具不绘制图形
    if (currentTool.value === 'select' || currentTool.value === 'fill') {
      return
    }

    isDrawing.value = true
    startPoint.value = { x, y }

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

  const stopDrawing = (canvas: Canvas | null, properties: ObjectProperties) => {
    if (!canvas) return

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
        activeObject.setCoords()
      }
    }

    isDrawing.value = false
    startPoint.value = null

    if (currentTool.value !== 'select') {
      setTool('select')
    }
  }

  const updateDrawing = (x: number, y: number, canvas: Canvas | null) => {
    if (!canvas) return
    if (!isDrawing.value || !startPoint.value) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    if (currentTool.value === 'line') {
      const line = activeObject as Line
      line.set({
        x2: x,
        y2: y
      })
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

  const createShape = ({ tool, x, y, properties }: CreateShapeParams): FabricObject | null => {
    let shape: FabricObject | null = null

    switch (tool) {
      case 'rect':
        shape = new Rect({
          left: x,
          top: y,
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: properties.stroke,
          strokeWidth: properties.strokeWidth,
          opacity: properties.opacity,
          strokeDashArray: [...properties.strokeDashArray],
          originX: 'left',
          originY: 'top'
        })
        break

      case 'circle':
        shape = new Circle({
          left: x,
          top: y,
          radius: 0,
          fill: 'transparent',
          stroke: properties.stroke,
          strokeWidth: properties.strokeWidth,
          opacity: properties.opacity,
          strokeDashArray: [...properties.strokeDashArray],
          originX: 'center',
          originY: 'center'
        })
        break

      case 'ellipse':
        shape = new Ellipse({
          left: x,
          top: y,
          rx: 0,
          ry: 0,
          fill: 'transparent',
          stroke: properties.stroke,
          strokeWidth: properties.strokeWidth,
          opacity: properties.opacity,
          strokeDashArray: [...properties.strokeDashArray],
          originX: 'center',
          originY: 'center'
        })
        break

      case 'line':
        shape = new Line([x, y, x, y], {
          stroke: properties.stroke,
          strokeWidth: properties.strokeWidth,
          strokeDashArray: [...properties.strokeDashArray],
          opacity: properties.opacity,
          fill: undefined
        })
        break

      case 'text':
        shape = new IText('双击编辑文字', {
          left: x,
          top: y,
          fontSize: 20,
          fill: properties.fill === 'transparent' ? '#000000' : properties.fill,
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
          left: left + width / 2,
          top: top + height / 2,
          rx: width / 2,
          ry: height / 2
        })
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

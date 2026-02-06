/**
 * 画布事件处理 Hook
 *
 * 统一处理画布上的鼠标事件
 */
import { Canvas, FabricObject } from 'fabric'

interface EventHandlers {
  onMouseDown: (x: number, y: number) => void
  onMouseMove: (x: number, y: number) => void
  onMouseUp: () => void
  onObjectSelected: (obj: FabricObject | null) => void
  onSelectionCleared: () => void
  onObjectModified: () => void
  onPathCreated: () => void
}

export function useCanvasEvents(canvas: Canvas | null, handlers: EventHandlers) {
  if (!canvas) {
    return {
      setupEvents: () => {},
      removeAllEvents: () => {}
    }
  }

  const setupEvents = () => {
    canvas.on('mouse:down', handleMouseDown as unknown as () => void)
    canvas.on('mouse:move', handleMouseMove as unknown as () => void)
    canvas.on('mouse:up', handleMouseUp)
    canvas.on('object:modified', handleObjectModified)
    canvas.on('selection:created', handleObjectSelected as unknown as () => void)
    canvas.on('selection:cleared', handleSelectionCleared)
    canvas.on('path:created', handlePathCreated)
  }

  const handleMouseDown = (opt: { e: MouseEvent }) => {
    const pointer = canvas.getScenePoint(opt.e)
    handlers.onMouseDown(pointer.x, pointer.y)
  }

  const handleMouseMove = (opt: { e: MouseEvent }) => {
    const pointer = canvas.getScenePoint(opt.e)
    handlers.onMouseMove(pointer.x, pointer.y)
  }

  const handleMouseUp = () => {
    handlers.onMouseUp()
  }

  const handleObjectModified = () => {
    handlers.onObjectModified()
  }

  const handleObjectSelected = (opt: { selected: FabricObject[] }) => {
    if (opt.selected.length > 0) {
      handlers.onObjectSelected(opt.selected[0])
    } else {
      handlers.onObjectSelected(null)
    }
  }

  const handleSelectionCleared = () => {
    handlers.onSelectionCleared()
  }

  const handlePathCreated = () => {
    handlers.onPathCreated()
  }

  const removeAllEvents = () => {
    canvas.off('mouse:down', handleMouseDown as unknown as () => void)
    canvas.off('mouse:move', handleMouseMove as unknown as () => void)
    canvas.off('mouse:up', handleMouseUp)
    canvas.off('object:modified', handleObjectModified)
    canvas.off('selection:created', handleObjectSelected as unknown as () => void)
    canvas.off('selection:cleared', handleSelectionCleared)
    canvas.off('path:created', handlePathCreated)
  }

  return {
    setupEvents,
    removeAllEvents
  }
}

/**
 * 画布事件处理 Hook
 *
 * 统一处理画布上的鼠标事件
 */

interface EventHandlers {
  onMouseDown: (x: number, y: number) => void
  onMouseMove: (x: number, y: number) => void
  onMouseUp: () => void
  onObjectSelected: (obj: any) => void
  onSelectionCleared: () => void
  onObjectModified: () => void
  onPathCreated: () => void
}

export function useCanvasEvents(canvas: any, handlers: EventHandlers) {
  const setupEvents = () => {
    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
    canvas.on('object:modified', handleObjectModified)
    canvas.on('object:selected', handleObjectSelected)
    canvas.on('selection:cleared', handleSelectionCleared)
    canvas.on('path:created', handlePathCreated)
  }

  const handleMouseDown = (opt: any) => {
    const pointer = canvas.getPointer(opt.e)
    if (!pointer) return
    handlers.onMouseDown(pointer.x, pointer.y)
  }

  const handleMouseMove = (opt: any) => {
    const pointer = canvas.getPointer(opt.e)
    if (!pointer) return
    handlers.onMouseMove(pointer.x, pointer.y)
  }

  const handleMouseUp = () => {
    handlers.onMouseUp()
  }

  const handleObjectModified = () => {
    handlers.onObjectModified()
  }

  const handleObjectSelected = (opt: any) => {
    handlers.onObjectSelected(opt.target)
  }

  const handleSelectionCleared = () => {
    handlers.onSelectionCleared()
  }

  const handlePathCreated = () => {
    handlers.onPathCreated()
  }

  const removeAllEvents = () => {
    canvas.off('mouse:down', handleMouseDown)
    canvas.off('mouse:move', handleMouseMove)
    canvas.off('mouse:up', handleMouseUp)
    canvas.off('object:modified', handleObjectModified)
    canvas.off('object:selected', handleObjectSelected)
    canvas.off('selection:cleared', handleSelectionCleared)
    canvas.off('path:created', handlePathCreated)
  }

  return {
    setupEvents,
    removeAllEvents
  }
}

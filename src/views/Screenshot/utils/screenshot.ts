export function calculateSelection(options: {
  startX: number
  startY: number
  endX: number
  endY: number
}): { x: number; y: number; width: number; height: number } {
  const { startX, startY, endX, endY } = options
  const x = Math.min(startX, endX)
  const y = Math.min(startY, endY)
  const width = Math.abs(endX - startX)
  const height = Math.abs(endY - startY)

  return { x, y, width, height }
}

export function isValidSelection(width: number, height: number, minSize = 5): boolean {
  return width >= minSize && height >= minSize
}

export interface CanvasAction {
  json: any
}

export function createCanvasHistory() {
  const undoStack: CanvasAction[] = []
  const redoStack: CanvasAction[] = []

  function saveState(json: any) {
    undoStack.push({ json })
    redoStack.length = 0
  }

  function canUndo(): boolean {
    return undoStack.length > 1
  }

  function undo(): { action: CanvasAction } | null {
    if (undoStack.length <= 1) return null
    const current = undoStack.pop()!
    redoStack.push(current)
    const prev = undoStack[undoStack.length - 1]
    return { action: prev }
  }

  function canRedo(): boolean {
    return redoStack.length > 0
  }

  function redo(): { action: CanvasAction } | null {
    if (redoStack.length === 0) return null
    const next = redoStack.pop()!
    undoStack.push(next)
    return { action: next }
  }

  return {
    saveState,
    canUndo,
    undo,
    canRedo,
    redo
  }
}

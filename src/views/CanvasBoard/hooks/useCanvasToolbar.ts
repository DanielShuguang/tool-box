import { computed } from 'vue'
import { useMessage } from 'naive-ui'
import { CANVAS_TOOLBAR_ITEMS } from '../constants'
import type { ToolbarItem, DrawingTool } from '../types'

interface ToolbarOptions {
  currentTool: any
  canUndo: any
  canRedo: any
  setTool: (tool: DrawingTool) => void
  handleUndo: () => void
  handleRedo: () => void
  handleDelete: () => void
  getCanvas: () => any
  saveToHistory: () => void
  clearCanvas: (canvas: any) => void
  deleteSelected: (canvas: any, callback: () => void) => void
  handleZoom: (delta: number) => void
  resetZoom: () => void
  openExportDialog: () => void
  triggerFileInput: () => void
  triggerImageInput: () => void
}

export function useCanvasToolbar(options: ToolbarOptions) {
  const message = useMessage()

  const toolbarItems = computed(() =>
    CANVAS_TOOLBAR_ITEMS.map(item => {
      if (item.type === 'separator') return item

      if (item.type === 'tool') {
        return {
          ...item,
          buttonType: 'primary' as const,
          disabled: false
        }
      }

      if (item.type === 'action') {
        const disabledMap: Record<string, boolean> = {
          undo: !options.canUndo.value,
          redo: !options.canRedo.value
        }
        return {
          ...item,
          disabled: disabledMap[item.id] ?? false
        }
      }

      return item
    })
  )

  const handleToolbarAction = (item: ToolbarItem) => {
    if (item.disabled || item.type === 'separator') return

    if (item.type === 'tool') {
      options.setTool(item.id as any)
      return
    }

    const actionMap: Record<string, () => void> = {
      undo: options.handleUndo,
      redo: options.handleRedo,
      delete: options.handleDelete,
      clear: () => {
        options.clearCanvas(options.getCanvas())
        options.saveToHistory()
        message.success('画布已清空')
      },
      'zoom-out': () => options.handleZoom(-1),
      'zoom-in': () => options.handleZoom(1),
      'zoom-reset': options.resetZoom,
      export: options.openExportDialog,
      import: options.triggerFileInput,
      image: options.triggerImageInput
    }

    const action = actionMap[item.id]
    if (action) action()
  }

  return {
    toolbarItems,
    handleToolbarAction
  }
}

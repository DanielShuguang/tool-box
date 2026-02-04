/**
 * 键盘快捷键 Hook
 *
 * 处理键盘事件绑定和快捷键响应
 */
import { onMounted, onUnmounted } from 'vue'
import type { DrawingTool } from '../types'

interface ShortcutHandlers {
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
  onToolChange?: (tool: DrawingTool) => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handlers.onRedo()
        } else {
          handlers.onUndo()
        }
      } else if (e.key === 'y') {
        e.preventDefault()
        handlers.onRedo()
      }
    } else {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handlers.onDelete()
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    handleKeyDown
  }
}

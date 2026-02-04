/**
 * 历史记录管理 Hook
 *
 * 处理撤销、恢复功能和状态保存
 */
import { ref, computed } from 'vue'
import type { HistoryState } from '../types'
import { MAX_HISTORY_SIZE, AUTO_SAVE_INTERVAL } from '../constants'

export function useHistory() {
  const historyStack = ref<HistoryState[]>([])
  const historyIndex = ref(-1)
  const isInternalChange = ref(false)

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1)

  let autoSaveTimer: ReturnType<typeof setInterval> | null = null
  let canvasInstance: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messageHandler: ((msg: string) => void) | null = null

  const initHistory = (canvas: any, onMessage?: (msg: string) => void) => {
    canvasInstance = canvas
    messageHandler = onMessage || null
    startAutoSave()
  }

  const saveToHistory = (json?: string) => {
    if (!canvasInstance) return

    const stateJson = json || JSON.stringify(canvasInstance.toJSON())
    const now = Date.now()

    if (historyIndex.value < historyStack.value.length - 1) {
      historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
    }

    const prevState = historyStack.value[historyStack.value.length - 1]
    if (prevState && prevState.json === stateJson) {
      return
    }

    historyStack.value.push({ json: stateJson, timestamp: now })

    if (historyStack.value.length > MAX_HISTORY_SIZE) {
      historyStack.value.shift()
    } else {
      historyIndex.value++
    }
  }

  const undo = () => {
    if (!canUndo.value || !canvasInstance) return

    historyIndex.value--
    const state = historyStack.value[historyIndex.value]

    canvasInstance.loadFromJSON(state.json, () => {
      canvasInstance.renderAll()
      messageHandler?.('撤销成功')
    })
  }

  const redo = () => {
    if (!canRedo.value || !canvasInstance) return

    historyIndex.value++
    const state = historyStack.value[historyIndex.value]

    canvasInstance.loadFromJSON(state.json, () => {
      canvasInstance.renderAll()
      messageHandler?.('恢复成功')
    })
  }

  const startAutoSave = () => {
    stopAutoSave()
    autoSaveTimer = setInterval(() => {
      saveToLocalStorage()
    }, AUTO_SAVE_INTERVAL)
  }

  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  const saveToLocalStorage = () => {
    if (!canvasInstance || historyIndex.value < 0) return
    const state = historyStack.value[historyIndex.value]
    if (state) {
      localStorage.setItem(
        'canvas_autosave',
        JSON.stringify({
          state,
          timestamp: Date.now()
        })
      )
    }
  }

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('canvas_autosave')
    if (saved) {
      try {
        const { state } = JSON.parse(saved)
        return state as HistoryState
      } catch {
        return null
      }
    }
    return null
  }

  const restoreFromState = (state: HistoryState, onComplete?: () => void) => {
    if (!canvasInstance) return

    historyIndex.value = 0
    historyStack.value = [state]
    canvasInstance.loadFromJSON(state.json, () => {
      canvasInstance.renderAll()
      onComplete?.()
    })
  }

  const getCurrentState = (): HistoryState | null => {
    if (historyIndex.value >= 0 && historyIndex.value < historyStack.value.length) {
      return historyStack.value[historyIndex.value]
    }
    return null
  }

  const clearHistory = () => {
    historyStack.value = []
    historyIndex.value = -1
  }

  const setInternalChange = (value: boolean) => {
    isInternalChange.value = value
  }

  const isInternalChangeState = () => isInternalChange.value

  const destroy = () => {
    stopAutoSave()
    saveToLocalStorage()
  }

  return {
    historyStack,
    historyIndex,
    canUndo,
    canRedo,
    initHistory,
    saveToHistory,
    undo,
    redo,
    loadFromLocalStorage,
    restoreFromState,
    getCurrentState,
    clearHistory,
    destroy,
    setInternalChange,
    isInternalChangeState
  }
}

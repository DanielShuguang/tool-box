/**
 * 历史栈管理 Hook
 *
 * 处理撤销/恢复的内存栈管理
 */
import type { HistoryState } from '../types'
import { MAX_HISTORY_SIZE } from '../constants'
import { Canvas } from 'fabric'

interface HistoryStackOptions {
  maxSize?: number
}

export function useHistoryStack(options: HistoryStackOptions = {}) {
  const maxSize = options.maxSize ?? MAX_HISTORY_SIZE

  const historyStack = ref<HistoryState[]>([])
  const historyIndex = ref(-1)
  const isInternalChange = ref(false)

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1)

  let canvasInstance: Canvas | null = null
  let messageHandler: ((msg: string) => void) | null = null
  let isRestoring = false

  const init = (canvas: Canvas, onMessage?: (msg: string) => void) => {
    canvasInstance = canvas
    messageHandler = onMessage ?? null
  }

  const setRestoring = (value: boolean) => {
    isRestoring = value
  }

  const save = (json?: string) => {
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

    if (historyStack.value.length > maxSize) {
      historyStack.value.shift()
    } else {
      historyIndex.value++
    }
  }

  const undo = () => {
    if (!canUndo.value || !canvasInstance) return

    historyIndex.value--
    const state = historyStack.value[historyIndex.value]
    const instance = canvasInstance
    const stateJson = state.json

    let hasCompleted = false
    instance.loadFromJSON(stateJson, () => {
      if (hasCompleted) return
      hasCompleted = true

      instance.renderAll()
      instance.requestRenderAll()
      if (!isRestoring) {
        messageHandler?.('撤销成功')
      }
    })
  }

  const redo = () => {
    if (!canRedo.value || !canvasInstance) return

    historyIndex.value++
    const state = historyStack.value[historyIndex.value]
    const instance = canvasInstance
    const stateJson = state.json

    let hasCompleted = false
    instance.loadFromJSON(stateJson, () => {
      if (hasCompleted) return
      hasCompleted = true

      instance.renderAll()
      instance.requestRenderAll()
      if (!isRestoring) {
        messageHandler?.('恢复成功')
      }
    })
  }

  const restoreFromState = (state: HistoryState, onComplete?: () => void): boolean => {
    if (!canvasInstance) {
      console.warn('useHistoryStack: 画布实例不存在')
      return false
    }

    try {
      isRestoring = true
      let hasCompleted = false
      const parsedJson = JSON.parse(state.json)
      historyIndex.value = 0
      historyStack.value = [state]
      const instance = canvasInstance

      instance.loadFromJSON(parsedJson, () => {
        if (hasCompleted) return
        hasCompleted = true

        instance.renderAll()
        instance.requestRenderAll()
        requestAnimationFrame(() => {
          instance.renderAll()
          instance.requestRenderAll()
          isRestoring = false
        })
        onComplete?.()
      })
      return true
    } catch (error) {
      console.error('useHistoryStack: 恢复画布状态失败', error)
      return false
    }
  }

  const getCurrentState = (): HistoryState | null => {
    if (historyIndex.value >= 0 && historyIndex.value < historyStack.value.length) {
      return historyStack.value[historyIndex.value]
    }
    return null
  }

  const clear = () => {
    historyStack.value = []
    historyIndex.value = -1
  }

  const setInternalChange = (value: boolean) => {
    isInternalChange.value = value
  }

  const isInternalChangeState = () => isInternalChange.value

  const destroy = () => {
    canvasInstance = null
    messageHandler = null
  }

  return {
    historyStack,
    historyIndex,
    canUndo,
    canRedo,
    init,
    save,
    undo,
    redo,
    restoreFromState,
    getCurrentState,
    clear,
    setInternalChange,
    isInternalChangeState,
    setRestoring,
    destroy
  }
}

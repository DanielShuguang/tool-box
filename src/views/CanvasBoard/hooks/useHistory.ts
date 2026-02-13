/**
 * 历史记录管理 Hook
 *
 * 处理撤销、恢复功能和状态保存
 * 组合 useHistoryStack、useAutoSave、useCanvasStorage 三个模块
 */
import type { HistoryState } from '../types'
import { Canvas } from 'fabric'
import { useHistoryStack } from './useHistoryStack'
import { useAutoSave } from './useAutoSave'
import { useCanvasStorage } from './useCanvasStorage'

export function useHistory() {
  const historyStackModule = useHistoryStack()
  const autoSaveModule = useAutoSave()
  const storageModule = useCanvasStorage()

  let canvasInstance: Canvas | null = null

  const initHistory = (canvas: Canvas | null, onMessage?: (msg: string) => void) => {
    if (!canvas) return
    canvasInstance = canvas

    historyStackModule.init(canvas, onMessage)
    autoSaveModule.start(storageModule.save)
  }

  const getCanvasState = (): string => {
    if (!canvasInstance) return ''
    return JSON.stringify(canvasInstance.toJSON())
  }

  const saveToHistory = (json?: string) => {
    historyStackModule.save(json)
    triggerAutoSave()
  }

  const triggerAutoSave = () => {
    const stateJson = getCanvasState()
    autoSaveModule.trigger(stateJson)
  }

  const undo = () => {
    historyStackModule.undo()
  }

  const redo = () => {
    historyStackModule.redo()
  }

  const loadFromLocalStorage = async (): Promise<HistoryState | null> => {
    return await storageModule.load()
  }

  const restoreFromState = (state: HistoryState, onComplete?: () => void): boolean => {
    return historyStackModule.restoreFromState(state, onComplete)
  }

  const getCurrentState = (): HistoryState | null => {
    return historyStackModule.getCurrentState()
  }

  const clearHistory = () => {
    historyStackModule.clear()
  }

  const setInternalChange = (value: boolean) => {
    historyStackModule.setInternalChange(value)
  }

  const setRestoring = (value: boolean) => {
    historyStackModule.setRestoring(value)
  }

  const isInternalChangeState = () => {
    return historyStackModule.isInternalChangeState()
  }

  const destroy = async () => {
    triggerAutoSave()
    autoSaveModule.destroy()
    historyStackModule.destroy()
    canvasInstance = null
  }

  return {
    historyStack: historyStackModule.historyStack,
    historyIndex: historyStackModule.historyIndex,
    canUndo: historyStackModule.canUndo,
    canRedo: historyStackModule.canRedo,
    initHistory,
    saveToHistory,
    triggerAutoSave,
    undo,
    redo,
    loadFromLocalStorage,
    restoreFromState,
    getCurrentState,
    clearHistory,
    destroy,
    setInternalChange,
    isInternalChangeState,
    setRestoring
  }
}

import { describe, it, expect } from 'vitest'
import { calculateSelection, isValidSelection, createCanvasHistory } from '../utils/screenshot'

describe('calculateSelection', () => {
  it('应该计算正向拖拽的选择区域', () => {
    const result = calculateSelection({ startX: 100, startY: 200, endX: 400, endY: 500 })
    expect(result).toEqual({ x: 100, y: 200, width: 300, height: 300 })
  })

  it('应该计算反向拖拽的选择区域（从右下到左上）', () => {
    const result = calculateSelection({ startX: 400, startY: 500, endX: 100, endY: 200 })
    expect(result).toEqual({ x: 100, y: 200, width: 300, height: 300 })
  })

  it('应该计算水平反向拖拽', () => {
    const result = calculateSelection({ startX: 400, startY: 200, endX: 100, endY: 500 })
    expect(result).toEqual({ x: 100, y: 200, width: 300, height: 300 })
  })

  it('应该计算垂直反向拖拽', () => {
    const result = calculateSelection({ startX: 100, startY: 500, endX: 400, endY: 200 })
    expect(result).toEqual({ x: 100, y: 200, width: 300, height: 300 })
  })

  it('应该处理点击不拖拽（零尺寸）', () => {
    const result = calculateSelection({ startX: 100, startY: 100, endX: 100, endY: 100 })
    expect(result).toEqual({ x: 100, y: 100, width: 0, height: 0 })
  })

  it('应该处理像素级选择', () => {
    const result = calculateSelection({ startX: 100, startY: 100, endX: 101, endY: 102 })
    expect(result).toEqual({ x: 100, y: 100, width: 1, height: 2 })
  })
})

describe('isValidSelection', () => {
  it('应该通过大于最小尺寸的选择', () => {
    expect(isValidSelection(100, 100)).toBe(true)
  })

  it('应该拒绝宽度小于 5 的选择', () => {
    expect(isValidSelection(3, 100)).toBe(false)
  })

  it('应该拒绝高度小于 5 的选择', () => {
    expect(isValidSelection(100, 3)).toBe(false)
  })

  it('应该通过恰好等于最小尺寸的选择', () => {
    expect(isValidSelection(5, 5)).toBe(true)
  })

  it('应该支持自定义最小尺寸', () => {
    expect(isValidSelection(10, 10, 10)).toBe(true)
    expect(isValidSelection(9, 10, 10)).toBe(false)
  })

  it('应该拒绝零尺寸选择', () => {
    expect(isValidSelection(0, 0)).toBe(false)
  })
})

describe('createCanvasHistory', () => {
  it('应该初始化空的撤销/重做栈', () => {
    const history = createCanvasHistory()
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
    expect(history.undo()).toBeNull()
    expect(history.redo()).toBeNull()
  })

  it('saveState 应该允许撤销', () => {
    const history = createCanvasHistory()
    history.saveState({ shapes: [] })
    expect(history.canUndo()).toBe(false)
    history.saveState({ shapes: [{ type: 'rect' }] })
    expect(history.canUndo()).toBe(true)
  })

  it('undo 应该返回上一个状态', () => {
    const history = createCanvasHistory()
    history.saveState({ shapes: [] })
    history.saveState({ shapes: [{ type: 'rect' }] })
    history.saveState({ shapes: [{ type: 'circle' }] })

    const result = history.undo()
    expect(result).not.toBeNull()
    expect(result!.action.json).toEqual({ shapes: [{ type: 'rect' }] })
    expect(history.canRedo()).toBe(true)
  })

  it('redo 应该恢复被撤销的状态', () => {
    const history = createCanvasHistory()
    history.saveState({ shapes: [] })
    history.saveState({ shapes: [{ type: 'rect' }] })
    history.saveState({ shapes: [{ type: 'circle' }] })

    history.undo()
    const result = history.redo()
    expect(result).not.toBeNull()
    expect(result!.action.json).toEqual({ shapes: [{ type: 'circle' }] })
    expect(history.canUndo()).toBe(true)
  })

  it('undo 在只有一个状态时应该返回 null', () => {
    const history = createCanvasHistory()
    history.saveState({ shapes: [] })
    expect(history.undo()).toBeNull()
  })

  it('redo 在重做栈为空时应该返回 null', () => {
    const history = createCanvasHistory()
    history.saveState({ shapes: [] })
    expect(history.redo()).toBeNull()
  })

  it('saveState 在新的修改后应该清空重做栈', () => {
    const history = createCanvasHistory()
    history.saveState({ shapes: [] })
    history.saveState({ shapes: [{ type: 'rect' }] })
    history.undo()
    expect(history.canRedo()).toBe(true)

    history.saveState({ shapes: [{ type: 'text' }] })
    expect(history.canRedo()).toBe(false)
    expect(history.canUndo()).toBe(true)
  })

  it('应该支持多次撤销/重做', () => {
    const history = createCanvasHistory()
    history.saveState({ shapes: [] })
    history.saveState({ shapes: [{ type: 'rect' }] })
    history.saveState({ shapes: [{ type: 'circle' }] })
    history.saveState({ shapes: [{ type: 'text' }] })

    const u1 = history.undo()
    expect(u1!.action.json).toEqual({ shapes: [{ type: 'circle' }] })

    const u2 = history.undo()
    expect(u2!.action.json).toEqual({ shapes: [{ type: 'rect' }] })

    const u3 = history.undo()
    expect(u3).not.toBeNull()
    expect(u3!.action.json).toEqual({ shapes: [] })

    const u4 = history.undo()
    expect(u4).toBeNull()

    const r1 = history.redo()
    expect(r1!.action.json).toEqual({ shapes: [{ type: 'rect' }] })

    const r2 = history.redo()
    expect(r2!.action.json).toEqual({ shapes: [{ type: 'circle' }] })
  })

  it('canUndo 和 canRedo 应该正确反映状态', () => {
    const history = createCanvasHistory()
    history.saveState({ shapes: [] })
    expect(history.canUndo()).toBe(false)

    history.saveState({ shapes: [{ type: 'rect' }] })
    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)

    history.undo()
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(true)
  })
})

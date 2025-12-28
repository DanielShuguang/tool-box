import { useSelectionStore } from '@/stores/selection'
import { useSelectionCore } from './useSelectionCore'
import { useSelectionKeyboard } from './useSelectionKeyboard'
import { useSelectionBox } from './useSelectionBox'

/**
 * 列表选择组合式函数
 * 提供原生桌面应用风格的多选交互
 */
export function useListSelection<T extends { id: string }>(
  items: () => T[],
  options: {
    /** 是否在空白处点击时清空选择 */
    clearOnBackgroundClick?: boolean
    /** 列表容器引用（可选，优先使用外部传入的ref） */
    containerRef?: Ref<HTMLElement | null>
  } = {}
) {
  const selectionStore = useSelectionStore()
  const { clearOnBackgroundClick = true, containerRef } = options

  // 基础选择功能
  const selectionCore = useSelectionCore(items, containerRef)

  // 框选功能
  const selectionBox = useSelectionBox(
    containerRef as Ref<HTMLElement | null>,
    items,
    (highlightedIds, hasModifier) => {
      const currentItems = items()

      if (highlightedIds.length > 0) {
        if (hasModifier) {
          // Ctrl/Cmd: 添加到现有选择
          highlightedIds.forEach(id => {
            const index = currentItems.findIndex(item => item.id === id)
            if (index !== -1) {
              selectionStore.toggleSelection(id, index)
            }
          })
        } else {
          // 替换现有选择
          selectionStore.clearSelection()
          highlightedIds.forEach(id => {
            const index = currentItems.findIndex(item => item.id === id)
            if (index !== -1) {
              selectionStore.toggleSelection(id, index)
            }
          })
        }
      }
    }
  )

  // 快捷键处理
  useSelectionKeyboard(items, selectionCore.toggleSelectAll, selectionCore.cancelSelection)

  /**
   * 批量操作：批量播放
   * 从选中项的第一首开始播放
   */
  const playSelected = (onPlay: (id: string) => void) => {
    const selectedIds = selectionStore.getSelectedIds()
    if (selectedIds.length > 0) {
      onPlay(selectedIds[0])
    }
  }

  /**
   * 批量操作：批量删除
   * @returns 被删除的 ID 数组
   */
  const removeSelected = () => {
    return selectionStore.removeSelected()
  }

  /**
   * 处理背景点击事件
   */
  const handleBackgroundClick = () => {
    const shouldClear = clearOnBackgroundClick && !selectionBox.isDragSelection.value
    if (shouldClear) {
      selectionCore.handleBackgroundClick(() => selectionBox.isDragSelection.value)
    }
  }

  return {
    // 状态
    selectedItems: selectionCore.selectedItems,
    selectedCount: selectionCore.selectedCount,
    hasSelection: selectionCore.hasSelection,
    isAllSelected: selectionCore.isAllSelected,
    selectionBoxStyle: selectionBox.selectionBoxStyle,
    temporarilyHighlightedIds: selectionBox.temporarilyHighlightedIds,
    // 方法
    handleRowClick: selectionCore.handleRowClick,
    handleRowDoubleClick: selectionCore.handleRowDoubleClick,
    handleBackgroundClick,
    toggleSelectAll: selectionCore.toggleSelectAll,
    cancelSelection: selectionCore.cancelSelection,
    playSelected,
    removeSelected,
    isSelected: selectionCore.isSelected,
    handleMouseDown: selectionBox.handleMouseDown,
    handleMouseMove: selectionBox.handleMouseMove,
    handleMouseUp: selectionBox.handleMouseUp
  }
}

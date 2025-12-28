import { useSelectionStore } from '@/stores/selection'

/**
 * 选择快捷键处理 Hook
 * 处理 Ctrl+A、Esc 等快捷键
 */
export function useSelectionKeyboard(
  items: () => { id: string }[],
  onToggleSelectAll?: () => void,
  onCancelSelection?: () => void
) {
  const selectionStore = useSelectionStore()
  const { escape } = useMagicKeys()

  /**
   * 检查是否在输入框中
   */
  const isInputElement = (activeElement: Element | null): boolean => {
    return (
      activeElement instanceof HTMLElement &&
      (['INPUT', 'TEXTAREA'].includes(activeElement.tagName) ||
        activeElement.contentEditable === 'true')
    )
  }

  /**
   * 全选/反选
   * Ctrl+A 触发
   */
  const handleToggleSelectAll = () => {
    if (onToggleSelectAll) {
      // 使用外部传入的全选逻辑
      onToggleSelectAll()
    } else {
      // 如果没有传入外部逻辑，则使用默认实现
      const currentList = items()
      const allIds = currentList.map(item => item.id)

      if (selectionStore.isAllSelected(allIds.length)) {
        selectionStore.clearSelection()
      } else {
        selectionStore.selectAll(allIds)
      }
    }
  }

  /**
   * 取消选择
   * Esc 触发
   */
  const cancelSelection = () => {
    selectionStore.clearSelection()
    onCancelSelection?.()
  }

  // 监听快捷键
  // Ctrl+A: 全选/反选
  const handleKeyDown = (event: KeyboardEvent) => {
    // 检查 Ctrl+A 或 Cmd+A
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      // 检查是否在输入框或文本区域中，如果是则不处理快捷键
      const activeElement = document.activeElement

      // 只有在非输入框中才处理 Ctrl+A
      if (!isInputElement(activeElement)) {
        // 阻止浏览器的默认全选行为
        event.preventDefault()
        // 执行列表全选
        handleToggleSelectAll()
      }
    }
  }

  // 使用事件监听器而不是 watch，以便能够阻止默认事件
  useEventListener(document, 'keydown', handleKeyDown)

  // Esc: 取消选择
  watch(escape, pressed => {
    if (pressed) {
      cancelSelection()
    }
  })

  return {
    toggleSelectAll: handleToggleSelectAll,
    cancelSelection
  }
}

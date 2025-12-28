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
  const { meta: isMeta, ctrl: isCtrl, a, escape } = useMagicKeys()

  // 检测 macOS 的 meta 键或 Windows 的 ctrl 键
  const hasModifier = computed(() => isMeta.value || isCtrl.value)

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
  const toggleSelectAll = () => {
    const currentList = items()
    const allIds = currentList.map(item => item.id)

    if (selectionStore.isAllSelected(allIds.length)) {
      selectionStore.clearSelection()
    } else {
      selectionStore.selectAll(allIds)
    }

    onToggleSelectAll?.()
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
  const isCtrlOrMetaPressed = computed(() => isMeta.value || isCtrl.value)
  watch([a, isCtrlOrMetaPressed], ([pressedA, pressedCtrl]) => {
    if (pressedA && pressedCtrl) {
      // 检查是否在输入框或文本区域中，如果是则不处理快捷键
      const activeElement = document.activeElement

      // 只有在非输入框中才处理 Ctrl+A
      if (!isInputElement(activeElement)) {
        toggleSelectAll()
      }
    }
  })

  // Esc: 取消选择
  watch(escape, pressed => {
    if (pressed) {
      cancelSelection()
    }
  })

  return {
    toggleSelectAll,
    cancelSelection,
    hasModifier
  }
}

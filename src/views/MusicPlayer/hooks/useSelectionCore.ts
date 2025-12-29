import { useSelectionStore } from '@/stores/selection'

/**
 * 基础选择功能 Hook
 * 处理行点击、双击、选择状态管理
 */
export function useSelectionCore<T extends { id: string }>(
  items: () => T[],
  _containerRef?: Ref<HTMLElement | null>
) {
  const selectionStore = useSelectionStore()
  const { meta: isMeta, ctrl: isCtrl, shift: isShift } = useMagicKeys()

  // 检测 macOS 的 meta 键或 Windows 的 ctrl 键
  const hasModifier = computed(() => isMeta.value || isCtrl.value)

  /**
   * 处理行点击事件
   * @param item 被点击的项
   * @param index 索引
   * @param event 鼠标事件
   */
  const handleRowClick = (item: T, index: number, event: MouseEvent) => {
    // 左键点击（button === 0）
    if (event.button !== 0) return

    const id = item.id
    const currentList = items()

    // Shift + 点击：范围选择
    if (isShift.value && selectionStore.lastSelectedIndex >= 0) {
      selectionStore.selectRange(
        selectionStore.lastSelectedIndex,
        index,
        idx => currentList[idx]?.id
      )
    }
    // Ctrl/Cmd + 点击：切换选择
    else if (hasModifier.value) {
      selectionStore.toggleSelection(id, index)
    }
    // 普通单击：单选
    else {
      selectionStore.selectSingle(id, index)
    }
  }

  /**
   * 处理双击事件（播放）
   * 双击不改变选择状态，直接播放
   * @param item 被双击的项
   * @param onPlay 播放回调
   */
  const handleRowDoubleClick = (item: T, onPlay: (item: T) => void) => {
    onPlay(item)
  }

  /**
   * 处理背景点击事件
   * 点击空白区域清空选择
   */
  const handleBackgroundClick = (isDragSelection: () => boolean) => {
    // 如果正在进行框选或刚完成框选（避免框选后触发click事件清空选择）
    if (isDragSelection()) return

    selectionStore.clearSelection()
  }

  /**
   * 全选/反选
   */
  const toggleSelectAll = () => {
    const currentList = items()
    const allIds = currentList.map(item => item.id)

    if (selectionStore.isAllSelected(allIds.length)) {
      selectionStore.clearSelection()
    } else {
      selectionStore.selectAll(allIds)
    }
  }

  /**
   * 取消选择
   */
  const cancelSelection = () => {
    selectionStore.clearSelection()
  }

  /**
   * 检查某个项是否被选中
   */
  const isSelected = (id: string): boolean => {
    return selectionStore.isSelected(id)
  }

  const selectedItems = computed(() => {
    const currentList = items()
    const selectedIdsArray = selectionStore.getSelectedIds()
    return currentList.filter(item => selectedIdsArray.includes(item.id))
  })

  /**
   * 是否全选
   */
  const isAllSelected = computed(() => selectionStore.isAllSelected(items().length))

  return {
    // 状态
    selectedItems,
    isAllSelected,
    hasModifier,
    // 方法
    handleRowClick,
    handleRowDoubleClick,
    handleBackgroundClick,
    toggleSelectAll,
    cancelSelection,
    isSelected
  }
}

import { useSelectionStore } from '@/stores/selection'
import { useMagicKeys } from '@vueuse/core'

/**
 * 列表选择组合式函数
 * 提供原生桌面应用风格的多选交互
 */
export function useListSelection<T extends { id: string }>(
  items: () => T[],
  options: {
    /** 是否在空白处点击时清空选择 */
    clearOnBackgroundClick?: boolean
  } = {}
) {
  const selectionStore = useSelectionStore()
  const { clearOnBackgroundClick = true } = options

  const { meta: isMeta, ctrl: isCtrl, shift: isShift, a, escape } = useMagicKeys()

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
  const handleBackgroundClick = () => {
    if (clearOnBackgroundClick) {
      selectionStore.clearSelection()
    }
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
  }

  /**
   * 取消选择
   * Esc 触发
   */
  const cancelSelection = () => {
    selectionStore.clearSelection()
  }

  // 监听快捷键
  // Ctrl+A: 全选/反选
  const isCtrlOrMetaPressed = computed(() => isMeta.value || isCtrl.value)
  watch([a, isCtrlOrMetaPressed], ([pressedA, pressedCtrl]) => {
    if (pressedA && pressedCtrl) {
      toggleSelectAll()
    }
  })

  // Esc: 取消选择
  watch(escape, pressed => {
    if (pressed) {
      cancelSelection()
    }
  })

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
   * 检查某个项是否被选中
   */
  const isSelected = (id: string): boolean => {
    return selectionStore.isSelected(id)
  }

  /**
   * 获取选中项
   */
  const selectedItems = computed(() => {
    const currentList = items()
    const selectedIds = selectionStore.getSelectedIds()
    return currentList.filter(item => selectedIds.includes(item.id))
  })

  const { selectedCount, hasSelection } = storeToRefs(selectionStore)

  /**
   * 是否全选
   */
  const isAllSelected = computed(() => selectionStore.isAllSelected(items().length))

  return {
    // 状态
    selectedItems,
    selectedCount,
    hasSelection,
    isAllSelected,
    // 方法
    handleRowClick,
    handleRowDoubleClick,
    handleBackgroundClick,
    toggleSelectAll,
    cancelSelection,
    playSelected,
    removeSelected,
    isSelected
  }
}

// 导出 watch 以便使用
import { watch } from 'vue'

import { useSelectionStore } from '@/stores/selection'
import { useMagicKeys } from '@vueuse/core'
import { computed, watch, ref } from 'vue'
import { storeToRefs } from 'pinia'

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
    containerRef?: { value: HTMLElement | null }
  } = {}
) {
  const selectionStore = useSelectionStore()
  const { clearOnBackgroundClick = true, containerRef } = options

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
    // 如果正在进行框选或刚完成框选（避免框选后触发click事件清空选择）
    if (isDragSelection.value) return

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

  // 鼠标位置跟踪（预留，当前通过事件对象获取位置）

  // 选择框状态
  const selectionBox = ref({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isActive: false
  })

  // 临时高亮的项 ID（仅在选择过程中有效）
  const temporarilyHighlightedIds = ref<Set<string>>(new Set())

  // 框选开始前的选择状态（用于取消操作时恢复）
  const selectionBeforeDrag = ref<Set<string>>(new Set())

  // 标志：是否正在进行拖拽选择（用于区分普通点击和框选操作）
  const isDragSelection = ref(false)

  // 选择框样式计算
  const selectionBoxStyle = computed(() => {
    const { startX, startY, currentX, currentY, isActive } = selectionBox.value
    if (!isActive) return { display: 'none' } as const

    const left = Math.min(startX, currentX)
    const top = Math.min(startY, currentY)

    return {
      position: 'absolute' as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${Math.abs(currentX - startX)}px`,
      height: `${Math.abs(currentY - startY)}px`,
      background: 'rgba(66, 153, 225, 0.3)',
      border: '1px solid rgba(66, 153, 225, 0.8)',
      zIndex: 9999,
      pointerEvents: 'none' as const
    } as const
  })

  /**
   * 检测元素是否与选择框相交
   */
  const isElementInSelectionBox = (element: HTMLElement): boolean => {
    if (!containerRef?.value || !selectionBox.value.isActive) return false

    const elementRect = element.getBoundingClientRect()
    const containerRect = containerRef.value.getBoundingClientRect()

    const { startX, startY, currentX, currentY } = selectionBox.value
    const boxLeft = Math.min(startX, currentX)
    const boxTop = Math.min(startY, currentY)
    const boxRight = Math.max(startX, currentX)
    const boxBottom = Math.max(startY, currentY)

    // 将元素坐标转换为相对于容器的坐标
    const elementLeft = elementRect.left - containerRect.left
    const elementTop = elementRect.top - containerRect.top
    const elementRight = elementRect.right - containerRect.left
    const elementBottom = elementRect.bottom - containerRect.top

    // 检测矩形相交
    return (
      elementLeft < boxRight &&
      elementRight > boxLeft &&
      elementTop < boxBottom &&
      elementBottom > boxTop
    )
  }

  /**
   * 更新临时高亮的项
   */
  const updateTemporaryHighlight = () => {
    if (!containerRef?.value || !selectionBox.value.isActive) {
      temporarilyHighlightedIds.value.clear()
      return
    }

    const currentItems = items()
    const newHighlightedIds = new Set<string>()

    // 遍历所有项，检测是否在选择框内
    currentItems.forEach((item, index) => {
      const rowElement = containerRef.value?.querySelector(`[data-index="${index}"]`)
      if (rowElement && isElementInSelectionBox(rowElement as HTMLElement)) {
        newHighlightedIds.add(item.id)
      }
    })

    temporarilyHighlightedIds.value = newHighlightedIds
  }

  /**
   * 重置选择框状态
   */
  const resetSelectionBox = () => {
    selectionBox.value = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isActive: false
    }
    temporarilyHighlightedIds.value.clear()
  }

  /**
   * 处理鼠标按下事件 - 开始选择
   */
  const handleMouseDown = (event: MouseEvent) => {
    // 只响应左键点击
    if (event.button !== 0) return

    const container = containerRef?.value
    if (!container) return

    // 保存初始选择状态，用于取消操作时恢复
    selectionBeforeDrag.value = new Set(selectionStore.getSelectedIds())

    // 开始拖拽选择
    isDragSelection.value = true

    const containerRect = container.getBoundingClientRect()
    // 考虑容器的滚动偏移量
    selectionBox.value = {
      startX: event.clientX - containerRect.left + container.scrollLeft,
      startY: event.clientY - containerRect.top + container.scrollTop,
      currentX: event.clientX - containerRect.left + container.scrollLeft,
      currentY: event.clientY - containerRect.top + container.scrollTop,
      isActive: true
    }
  }

  /**
   * 处理鼠标移动事件 - 更新选择框
   */
  const handleMouseMove = (event: MouseEvent) => {
    if (!selectionBox.value.isActive) return

    const container = containerRef?.value
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    // 考虑容器的滚动偏移量
    selectionBox.value.currentX = event.clientX - containerRect.left + container.scrollLeft
    selectionBox.value.currentY = event.clientY - containerRect.top + container.scrollTop

    updateTemporaryHighlight()
  }

  /**
   * 处理鼠标释放事件 - 完成选择
   */
  const handleMouseUp = () => {
    if (!selectionBox.value.isActive) return

    const highlighted = Array.from(temporarilyHighlightedIds.value)
    const currentItems = items()

    if (highlighted.length > 0) {
      if (hasModifier.value) {
        // Ctrl/Cmd: 添加到现有选择
        highlighted.forEach(id => {
          const index = currentItems.findIndex(item => item.id === id)
          if (index !== -1) {
            selectionStore.toggleSelection(id, index)
          }
        })
      } else {
        // 替换现有选择
        selectionStore.clearSelection()
        highlighted.forEach(id => {
          const index = currentItems.findIndex(item => item.id === id)
          if (index !== -1) {
            selectionStore.toggleSelection(id, index)
          }
        })
      }
    }

    resetSelectionBox()

    // 延迟一小段时间再重置标志，确保click事件不会被误判
    setTimeout(() => {
      isDragSelection.value = false
    }, 100)
  }

  /**
   * 处理键盘事件
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    // 按 Esc 键取消框选
    if (event.key === 'Escape' && selectionBox.value.isActive) {
      // 恢复到框选开始前的选择状态
      selectionStore.clearSelection()
      const currentItems = items()
      Array.from(selectionBeforeDrag.value).forEach(id => {
        const index = currentItems.findIndex(item => item.id === id)
        if (index !== -1) {
          selectionStore.selectSingle(id, index)
        }
      })
      resetSelectionBox()
    }
  }

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
    selectionBoxStyle,
    temporarilyHighlightedIds,
    // 方法
    handleRowClick,
    handleRowDoubleClick,
    handleBackgroundClick,
    toggleSelectAll,
    cancelSelection,
    playSelected,
    removeSelected,
    isSelected,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown
  }
}

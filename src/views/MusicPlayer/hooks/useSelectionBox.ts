import { useSelectionStore } from '@/stores/selection'

export interface SelectionBoxState {
  startX: number
  startY: number
  currentX: number
  currentY: number
  isActive: boolean
}

/**
 * 选择框功能 Hook
 * 处理鼠标拖拽选择框逻辑
 */
export function useSelectionBox(
  containerRef: Ref<HTMLElement | null>,
  items: () => { id: string }[],
  onSelectionComplete?: (highlightedIds: string[], hasModifier: boolean) => void
) {
  const selectionStore = useSelectionStore()
  const { meta: isMeta, ctrl: isCtrl } = useMagicKeys()

  // 检测 macOS 的 meta 键或 Windows 的 ctrl 键
  const hasModifier = computed(() => isMeta.value || isCtrl.value)

  // 选择框状态
  const selectionBox = ref<SelectionBoxState>({
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
    if (!containerRef.value || !selectionBox.value.isActive) return false

    const elementRect = element.getBoundingClientRect()
    const containerRect = containerRef.value.getBoundingClientRect()
    const container = containerRef.value

    const { startX, startY, currentX, currentY } = selectionBox.value
    const boxLeft = Math.min(startX, currentX)
    const boxTop = Math.min(startY, currentY)
    const boxRight = Math.max(startX, currentX)
    const boxBottom = Math.max(startY, currentY)

    // 将元素坐标转换为相对于容器的坐标，并考虑容器的滚动偏移量
    const elementLeft = elementRect.left - containerRect.left + container.scrollLeft
    const elementTop = elementRect.top - containerRect.top + container.scrollTop
    const elementRight = elementRect.right - containerRect.left + container.scrollLeft
    const elementBottom = elementRect.bottom - containerRect.top + container.scrollTop

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
    if (!containerRef.value || !selectionBox.value.isActive) {
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

    const container = containerRef.value
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

    const container = containerRef.value
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

    if (highlighted.length > 0) {
      onSelectionComplete?.(highlighted, hasModifier.value)
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

  useEventListener(document, 'keydown', handleKeyDown)

  return {
    // 状态
    selectionBoxStyle,
    temporarilyHighlightedIds,
    isDragSelection,
    // 方法
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetSelectionBox
  }
}

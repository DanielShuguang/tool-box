/**
 * 选择状态
 */
export interface SelectionState {
  /** 选中的项 ID 集合 */
  selectedIds: Set<string>
  /** 上次点击的索引，用于 Shift 范围选择 */
  lastSelectedIndex: number
}

/**
 * 选择操作选项
 */
export type SelectionAction = 'play' | 'remove' | 'addToPlaylist' | 'download'

export const useSelectionStore = defineStore('playlistSelection', () => {
  const selectedIds = ref<Set<string>>(new Set())
  const lastSelectedIndex = ref(-1)

  /**
   * 检查某项是否被选中
   */
  const isSelected = (id: string): boolean => {
    return selectedIds.value.has(id)
  }

  /**
   * 获取选中的数量
   */
  const selectedCount = computed(() => selectedIds.value.size)

  /**
   * 是否全选
   */
  const isAllSelected = (total: number): boolean => {
    return total > 0 && selectedIds.value.size === total
  }

  /**
   * 是否有选中的项
   */
  const hasSelection = computed(() => selectedIds.value.size > 0)

  /**
   * 清空选择
   */
  const clearSelection = () => {
    selectedIds.value.clear()
    lastSelectedIndex.value = -1
  }

  /**
   * 选择单个项（用于单击）
   */
  const selectSingle = (id: string, index: number) => {
    selectedIds.value.clear()
    selectedIds.value.add(id)
    lastSelectedIndex.value = index
  }

  /**
   * 切换单个项的选择状态（用于 Ctrl+单击）
   */
  const toggleSelection = (id: string, index: number) => {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
    lastSelectedIndex.value = index
  }

  /**
   * 范围选择（用于 Shift+单击）
   */
  const selectRange = (
    startIndex: number,
    endIndex: number,
    getItemId: (index: number) => string
  ) => {
    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)

    // 清空当前选择
    selectedIds.value.clear()

    // 选择范围内的所有项
    for (let i = start; i <= end; i++) {
      const id = getItemId(i)
      if (id) {
        selectedIds.value.add(id)
      }
    }

    lastSelectedIndex.value = endIndex
  }

  /**
   * 全选
   */
  const selectAll = (allIds: string[]) => {
    selectedIds.value = new Set(allIds)
    lastSelectedIndex.value = -1
  }

  /**
   * 批量删除选中的项
   * @returns 被删除的 ID 数组
   */
  const removeSelected = (): string[] => {
    const removed = Array.from(selectedIds.value)
    selectedIds.value.clear()
    lastSelectedIndex.value = -1
    return removed
  }

  /**
   * 获取选中的 ID 数组
   */
  const getSelectedIds = (): string[] => {
    return Array.from(selectedIds.value)
  }

  return {
    // 状态
    selectedIds,
    lastSelectedIndex,
    // 计算属性
    selectedCount,
    hasSelection,
    // 方法
    isSelected,
    isAllSelected,
    clearSelection,
    selectSingle,
    toggleSelection,
    selectRange,
    selectAll,
    removeSelected,
    getSelectedIds
  }
})

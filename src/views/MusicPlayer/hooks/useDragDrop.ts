/**
 * 拖拽功能 Hook
 * 处理文件拖拽事件，将拖入的文件传递给播放器协调器处理
 */
export interface UseDragDropOptions {
  /** 播放器协调器实例，用于处理拖入的文件 */
  coordinator: ReturnType<typeof import('./usePlayerCoordinator').usePlayerCoordinator>
}

/**
 * 拖拽功能 Hook
 * 管理拖拽状态和处理拖拽事件
 * @param options 配置选项，包含播放器协调器实例
 */
export function useDragDrop(options: UseDragDropOptions) {
  const { coordinator } = options

  /** 是否正在拖拽状态 */
  const isDragging = ref(false)

  /**
   * 处理文件放置事件
   * 阻止默认行为，获取拖拽文件并传递给协调器处理
   * @param e 拖拽事件对象
   */
  function handleDrop(e: DragEvent) {
    e.preventDefault()
    isDragging.value = false
    const files = Array.from(e.dataTransfer?.files || [])
    coordinator.handleFileDrop(files)
  }

  /**
   * 处理拖拽经过事件
   * 标记拖拽进入状态
   * @param e 拖拽事件对象
   */
  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    isDragging.value = true
  }

  /**
   * 处理拖拽离开事件
   * 清除拖拽状态
   * @param e 拖拽事件对象
   */
  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    isDragging.value = false
  }

  return {
    isDragging,
    handleDrop,
    handleDragOver,
    handleDragLeave
  }
}

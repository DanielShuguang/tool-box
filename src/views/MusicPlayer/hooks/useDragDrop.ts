export interface UseDragDropOptions {
  coordinator: ReturnType<typeof import('./usePlayerCoordinator').usePlayerCoordinator>
}

export function useDragDrop(options: UseDragDropOptions) {
  const { coordinator } = options
  const isDragging = ref(false)

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    isDragging.value = false
    const files = Array.from(e.dataTransfer?.files || [])
    coordinator.handleFileDrop(files)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    isDragging.value = true
  }

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

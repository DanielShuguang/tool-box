<script lang="ts" setup>
import Toolbar from './components/Toolbar.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import ExportDialog from './components/ExportDialog.vue'
import CanvasContainer from './components/CanvasContainer.vue'
import {
  useCanvasCore,
  useHistory,
  useDrawingTools,
  useObjectOperations,
  useFileOperations,
  useImageOperations,
  useKeyboardShortcuts,
  useCanvasExport,
  useCanvasImport,
  useCanvasToolbar,
  useCanvasImage,
  useDrawFile
} from './hooks'
import { SUPPORTED_EXPORT_FORMATS, DEFAULT_CANVAS_CONFIG, CURSOR_MAP } from './constants'
import type { ObjectProperties, ExportFormat, ExportMode } from './types'

const message = useMessage()

const canvasCore = useCanvasCore()
const history = useHistory()
const drawingTools = useDrawingTools()
const objectOps = useObjectOperations()
const fileOps = useFileOperations()
const canvasExport = useCanvasExport()
const canvasImport = useCanvasImport()
const canvasImage = useCanvasImage()

const { initCanvas, zoomIn, zoomOut, resetZoom, setPanning, handlePanWithDelta, getCanvas } =
  canvasCore
const {
  canUndo,
  canRedo,
  initHistory,
  saveToHistory,
  loadFromLocalStorage,
  restoreFromState,
  setInternalChange,
  setRestoring,
  destroy
} = history
const { currentTool, setTool } = drawingTools
const { objectProperties, deleteSelected, clearCanvas, updateObjectProperty } = objectOps
const { importFromFile, getCanvasDataURL, getCanvasSVG } = fileOps
const imageOps = useImageOperations()
const { insertImageFromFile, insertImageFromClipboard, insertImageFromDrop } = imageOps

const {
  showExportDialog,
  selectedExportFormat,
  isExporting,
  openExportDialog,
  closeExportDialog,
  handleExport
} = canvasExport
const { triggerFileInput, handleFileImport } = canvasImport
const { triggerImageInput, handleImageInsert, handlePaste, handleDrop, handleDragOver } =
  canvasImage

const selectedExportMode = ref<ExportMode>('image')
const drawFileInputRef = useTemplateRef<HTMLInputElement>('drawFileInput')

const drawFile = useDrawFile({
  getCanvas,
  saveToHistory,
  onLoadComplete: () => {
    message.success('画稿加载完成')
  }
})

const handleExportWrapper = async () => {
  if (selectedExportMode.value === 'draw') {
    const canvas = getCanvas()
    if (!canvas) {
      message.error('画布未初始化')
      return
    }
    await drawFile.exportDrawFile({
      width: canvas.width || DEFAULT_CANVAS_CONFIG.width,
      height: canvas.height || DEFAULT_CANVAS_CONFIG.height,
      backgroundColor: canvas.backgroundColor as string
    })
    closeExportDialog()
  } else {
    handleExport(getCanvas, getCanvasDataURL, getCanvasSVG)
  }
}

const handleFileImportWrapper = (event: Event) => {
  handleFileImport(event, { getCanvas, importFromFile, saveToHistory })
}

const handleImageInsertWrapper = (event: Event) => {
  handleImageInsert(event, { getCanvas, insertImageFromFile, saveToHistory })
}

const handlePasteWrapper = () => {
  handlePaste({ getCanvas, insertImageFromClipboard, saveToHistory })
}

const handleDropWrapper = async (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.name.endsWith('.draw')) {
      event.preventDefault()
      await drawFile.importDrawFileFromBlob(file)
      return
    }
  }
  handleDrop(event, { getCanvas, insertImageFromDrop, saveToHistory })
}

const triggerDrawFileInput = () => {
  drawFileInputRef.value?.click()
}

const handleDrawFileImport = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    await drawFile.importDrawFileFromBlob(input.files[0])
    input.value = ''
  }
}

const handleUndo = () => {
  setInternalChange(true)
  undo()
  setInternalChange(false)
}

const handleRedo = () => {
  setInternalChange(true)
  redo()
  setInternalChange(false)
}

const handleDelete = () => {
  const canvas = getCanvas()
  if (!canvas) return
  deleteSelected(canvas, () => {
    saveToHistory()
    message.success('删除成功')
  })
}

const handleZoom = (delta: number) => {
  if (delta > 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

const handlePropertyUpdate = (property: string, value: unknown) => {
  const canvas = getCanvas()
  if (!canvas) return
  updateObjectProperty(property as keyof ObjectProperties, value, canvas)
}

const setupEvents = () => {
  const canvas = getCanvas()
  if (!canvas) return

  canvas.on('mouse:down', handleMouseDown)
  canvas.on('mouse:move', handleMouseMove)
  canvas.on('mouse:up', handleMouseUp)
  canvas.on('object:modified', handleObjectModified)
  canvas.on('selection:created', handleObjectSelected)
  canvas.on('selection:cleared', handleSelectionCleared)
}

const handleMouseDown = (opt: unknown) => {
  if (canvasCore.isPanning.value) return

  const canvas = getCanvas()
  if (!canvas) return

  const pointer = canvas.getScenePoint((opt as { e: MouseEvent }).e)
  if (!pointer) return

  // 填色工具：点击图形时填充颜色
  if (currentTool.value === 'fill') {
    // 使用 searchPossibleTargets 避免缓存问题
    const targetInfo = canvas.searchPossibleTargets(canvas.getObjects(), pointer)
    const target = targetInfo?.target
    if (target) {
      target.set('fill', objectProperties.value.fill)
      target.setCoords()
      canvas.renderAll()
      saveToHistory()
      message.success('已填充颜色')
    }
    return
  }

  drawingTools.startDrawing({
    x: pointer.x,
    y: pointer.y,
    canvas,
    properties: objectProperties.value
  })
}

const handleMouseMove = (opt: unknown) => {
  if (canvasCore.isPanning.value) return

  const canvas = getCanvas()
  if (!canvas) return

  const pointer = canvas.getScenePoint((opt as { e: MouseEvent }).e)
  if (!pointer) return

  drawingTools.updateDrawing(pointer.x, pointer.y, canvas)
}

const handleMouseUp = () => {
  if (canvasCore.isPanning.value) return

  const canvas = getCanvas()
  if (!canvas) return
  drawingTools.stopDrawing(canvas, objectProperties.value)

  const activeObject = canvas.getActiveObject()
  if (activeObject) {
    saveToHistory()
  }
}

const handleObjectModified = () => {
  if (!canvasCore.isInternalChangeState()) {
    saveToHistory()
  }
}

const handleObjectSelected = (opt: { selected: unknown[] }) => {
  // 填色工具模式下不更新属性面板
  if (currentTool.value === 'fill') {
    return
  }
  if (Array.isArray(opt.selected) && opt.selected.length > 0) {
    objectOps.setSelectedObject(opt.selected[0])
  } else {
    objectOps.setSelectedObject(null)
  }
}

const handleSelectionCleared = () => {
  objectOps.clearSelection()
}

const handleRestore = async () => {
  const savedState = await loadFromLocalStorage()
  if (savedState) {
    message.info('检测到自动保存的画布，正在恢复...')
    setRestoring(true)
    const success = restoreFromState(savedState, () => {
      setRestoring(false)
      message.success('恢复成功')
    })
    if (!success) {
      setRestoring(false)
      message.error('恢复失败，已创建新画布')
      saveToHistory()
    }
  } else {
    saveToHistory()
  }
}

const { undo, redo } = history

useKeyboardShortcuts({
  onUndo: handleUndo,
  onRedo: handleRedo,
  onDelete: handleDelete
})

const handlePanStart = () => {
  setPanning(true)
  const canvas = getCanvas()
  if (canvas) {
    canvas.defaultCursor = 'grab'
  }
}

const handlePan = (dx: number, dy: number) => {
  handlePanWithDelta(dx, dy)
}

const handlePanEnd = () => {
  setPanning(false)
  updateCanvasCursor()
}

const updateCanvasCursor = () => {
  const canvas = getCanvas()
  if (!canvas) return

  canvas.defaultCursor = CURSOR_MAP[currentTool.value] || 'default'
  canvas.hoverCursor = currentTool.value === 'fill' ? 'crosshair' : 'move'
}

// 监听工具变化，更新光标
watch(currentTool, () => {
  updateCanvasCursor()
})

const handleWheel = (delta: number) => {
  handleZoom(delta)
}

const handleCanvasReady = (refs: { canvas: HTMLCanvasElement; container: HTMLDivElement }) => {
  initCanvas(refs.container, refs.canvas)
  setupEvents()
  initHistory(getCanvas(), (msg: string) => message.success(msg))
  handleRestore()
}

const canvasToolbar = useCanvasToolbar({
  currentTool,
  canUndo,
  canRedo,
  objectProperties,
  setTool,
  handleUndo,
  handleRedo,
  handleDelete,
  getCanvas,
  saveToHistory,
  clearCanvas,
  deleteSelected,
  handleZoom,
  resetZoom,
  openExportDialog,
  triggerFileInput,
  triggerImageInput,
  triggerDrawFileInput
})

const { toolbarItems, handleToolbarAction } = canvasToolbar

onUnmounted(() => {
  const canvas = getCanvas()
  if (canvas) {
    canvas.off('mouse:down', handleMouseDown)
    canvas.off('mouse:move', handleMouseMove)
    canvas.off('mouse:up', handleMouseUp)
    canvas.off('object:modified', handleObjectModified)
    canvas.off('selection:created', handleObjectSelected)
    canvas.off('selection:cleared', handleSelectionCleared)
  }
  destroy()
  canvasCore.dispose()
})
</script>

<template>
  <div class="canvas-board flex flex-col">
    <Toolbar
      :toolbar-items="toolbarItems"
      :current-tool="currentTool"
      :can-undo="canUndo"
      :can-redo="canRedo"
      @action="handleToolbarAction" />

    <div
      class="main-content flex-1 flex min-h-0"
      @paste="handlePasteWrapper"
      @drop="handleDropWrapper"
      @dragover="handleDragOver">
      <CanvasContainer
        @ready="handleCanvasReady"
        @pan-start="handlePanStart"
        @pan="handlePan"
        @pan-end="handlePanEnd"
        @wheel="handleWheel" />

      <PropertyPanel
        :object-properties="objectProperties"
        @update:property="handlePropertyUpdate" />
    </div>

    <ExportDialog
      :show="showExportDialog"
      :format="selectedExportFormat"
      :mode="selectedExportMode"
      :loading="isExporting || drawFile.isExporting.value"
      :export-formats="SUPPORTED_EXPORT_FORMATS"
      @update:show="(v: boolean) => (showExportDialog = v)"
      @update:format="(v: ExportFormat) => (selectedExportFormat = v)"
      @update:mode="(v: ExportMode) => (selectedExportMode = v)"
      @confirm="handleExportWrapper"
      @cancel="closeExportDialog" />

    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/svg+xml"
      class="hidden"
      @change="handleFileImportWrapper" />

    <input
      ref="imageInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
      class="hidden"
      @change="handleImageInsertWrapper" />

    <input
      ref="drawFileInput"
      type="file"
      accept=".draw"
      class="hidden"
      @change="handleDrawFileImport" />
  </div>
</template>

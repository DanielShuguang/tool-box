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
  useCanvasImage
} from './hooks'
import { SUPPORTED_EXPORT_FORMATS } from './constants'
import type { ObjectProperties, ToolbarItem, ExportFormat } from './types'

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
const { fileInputRef, triggerFileInput, handleFileImport } = canvasImport
const {
  imageInputRef,
  triggerImageInput,
  handleImageInsert,
  handlePaste,
  handleDrop,
  handleDragOver
} = canvasImage

const handleExportWrapper = () => {
  handleExport(getCanvas, getCanvasDataURL, getCanvasSVG)
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

const handleDropWrapper = (event: DragEvent) => {
  handleDrop(event, { getCanvas, insertImageFromDrop, saveToHistory })
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

const handlePropertyUpdate = (property: keyof ObjectProperties, value: unknown) => {
  const canvas = getCanvas()
  if (!canvas) return
  updateObjectProperty(property, value, canvas)
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
  canvas.on('path:created', handlePathCreated)
}

const handleMouseDown = (opt: unknown) => {
  if (canvasCore.isPanning.value) return

  const canvas = getCanvas()
  if (!canvas) return

  const pointer = canvas.getScenePoint((opt as { e: MouseEvent }).e)
  if (!pointer) return

  if (drawingTools.currentTool.value === 'select') {
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
}

const handleObjectModified = () => {
  if (!canvasCore.isInternalChangeState()) {
    saveToHistory()
  }
}

const handleObjectSelected = (opt: { selected: unknown[] }) => {
  if (Array.isArray(opt.selected) && opt.selected.length > 0) {
    objectOps.setSelectedObject(opt.selected[0])
  } else {
    objectOps.setSelectedObject(null)
  }
}

const handleSelectionCleared = () => {
  objectOps.clearSelection()
}

const handlePathCreated = () => {
  saveToHistory()
}

const handleRestore = () => {
  const savedState = loadFromLocalStorage()
  if (savedState) {
    message.info('检测到自动保存的画布，正在恢复...')
    restoreFromState(savedState, () => {
      saveToHistory()
      message.success('恢复成功')
    })
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
  const canvas = getCanvas()
  if (canvas) {
    canvas.defaultCursor = 'default'
  }
}

const handleWheel = (delta: number) => {
  handleZoom(delta)
}

const handleCanvasReady = (refs: { canvas: HTMLCanvasElement; container: HTMLDivElement }) => {
  initCanvas(refs.container, refs.canvas)
  setupEvents()
  initHistory(getCanvas(), (msg: string) => message.success(msg))
  saveToHistory()
  handleRestore()
}

const canvasToolbar = useCanvasToolbar({
  currentTool,
  canUndo,
  canRedo,
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
  triggerImageInput
})

const { toolbarItems, handleToolbarAction } = canvasToolbar

onMounted(() => {})

onUnmounted(() => {
  const canvas = getCanvas()
  if (canvas) {
    canvas.off('mouse:down', handleMouseDown)
    canvas.off('mouse:move', handleMouseMove)
    canvas.off('mouse:up', handleMouseUp)
    canvas.off('object:modified', handleObjectModified)
    canvas.off('selection:created', handleObjectSelected)
    canvas.off('selection:cleared', handleSelectionCleared)
    canvas.off('path:created', handlePathCreated)
  }
  destroy()
  canvasCore.dispose()
})
</script>

<template>
  <div class="canvas-board flex flex-col h-full">
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
      :loading="isExporting"
      :export-formats="SUPPORTED_EXPORT_FORMATS"
      @update:show="(v: boolean) => (showExportDialog = v)"
      @update:format="(v: ExportFormat) => (selectedExportFormat = v)"
      @confirm="handleExportWrapper"
      @cancel="closeExportDialog" />

    <input
      ref="fileInputRef"
      type="file"
      accept="image/png,image/jpeg,image/svg+xml"
      class="hidden"
      @change="handleFileImportWrapper" />

    <input
      ref="imageInputRef"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
      class="hidden"
      @change="handleImageInsertWrapper" />
  </div>
</template>

<style scoped>
.canvas-board {
  height: 100%;
}
</style>

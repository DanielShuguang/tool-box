<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { selectExportDirectory } from '../../backend-channel/file-io'
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
  useKeyboardShortcuts
} from './hooks'
import { CANVAS_TOOLBAR_ITEMS, SUPPORTED_EXPORT_FORMATS } from './constants'
import type { ObjectProperties, ToolbarItem, ExportFormat } from './types'

const message = useMessage()

const canvasCore = useCanvasCore()
const history = useHistory()
const drawingTools = useDrawingTools()
const objectOps = useObjectOperations()
const fileOps = useFileOperations()

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

const fileInputRef = ref<HTMLInputElement | null>(null)
const showExportDialog = ref(false)
const selectedExportFormat = ref<ExportFormat>('png')
const isExporting = ref(false)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileImport = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const result = await fileOps.importFromFile(getCanvas(), input.files[0], () => {
      saveToHistory()
      message.success('导入成功')
    })
    if (result) {
      message.success('导入成功')
    }
    input.value = ''
  }
}

const openExportDialog = () => {
  showExportDialog.value = true
  selectedExportFormat.value = 'png'
}

const closeExportDialog = () => {
  showExportDialog.value = false
  selectedExportFormat.value = 'png'
}

const handleExport = async () => {
  isExporting.value = true

  try {
    message.info('请选择导出目录...')
    const dirPath = await selectExportDirectory()

    if (!dirPath) {
      message.info('已取消导出')
      return
    }

    const canvas = getCanvas()
    if (!canvas) {
      message.error('画布未初始化')
      return
    }

    const format = selectedExportFormat.value
    const timestamp = Date.now()
    const filename = `canvas_export_${timestamp}.${format}`

    let data: string
    if (format === 'svg') {
      data = fileOps.getCanvasSVG(canvas)
      data = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data)
    } else {
      data = fileOps.getCanvasDataURL(canvas, format, 0.92)
    }

    const link = document.createElement('a')
    link.download = filename
    link.href = data
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success(`已导出到: ${dirPath}/${filename}`)
    closeExportDialog()
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  } finally {
    isExporting.value = false
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
  deleteSelected(getCanvas(), () => {
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
  updateObjectProperty(property, value, getCanvas())
}

const setupEvents = () => {
  const canvas = getCanvas()
  if (!canvas) return

  canvas.on('mouse:down', handleMouseDown)
  canvas.on('mouse:move', handleMouseMove)
  canvas.on('mouse:up', handleMouseUp)
  canvas.on('object:modified', handleObjectModified)
  canvas.on('object:selected', handleObjectSelected)
  canvas.on('selection:cleared', handleSelectionCleared)
  canvas.on('path:created', handlePathCreated)
}

const handleMouseDown = (opt: any) => {
  if (canvasCore.isPanning.value) return

  const pointer = getCanvas()?.getPointer(opt.e)
  if (!pointer) return

  if (drawingTools.currentTool.value === 'select') {
    return
  }

  drawingTools.startDrawing({
    x: pointer.x,
    y: pointer.y,
    canvas: getCanvas(),
    properties: objectProperties.value
  })
}

const handleMouseMove = (opt: any) => {
  if (canvasCore.isPanning.value) return

  const pointer = getCanvas()?.getPointer(opt.e)
  if (!pointer) return

  drawingTools.updateDrawing(pointer.x, pointer.y, getCanvas())
}

const handleMouseUp = () => {
  if (canvasCore.isPanning.value) return

  drawingTools.stopDrawing(getCanvas(), objectProperties.value)
}

const handleObjectModified = () => {
  if (!canvasCore.isInternalChangeState()) {
    saveToHistory()
  }
}

const handleObjectSelected = (opt: any) => {
  objectOps.setSelectedObject(opt.target)
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

onMounted(() => {})

onUnmounted(() => {
  const canvas = getCanvas()
  if (canvas) {
    canvas.off('mouse:down', handleMouseDown)
    canvas.off('mouse:move', handleMouseMove)
    canvas.off('mouse:up', handleMouseUp)
    canvas.off('object:modified', handleObjectModified)
    canvas.off('object:selected', handleObjectSelected)
    canvas.off('selection:cleared', handleSelectionCleared)
    canvas.off('path:created', handlePathCreated)
  }
  destroy()
  canvasCore.dispose()
})

const toolbarItems = computed(() =>
  CANVAS_TOOLBAR_ITEMS.map(item => {
    if (item.type === 'separator') return item

    if (item.type === 'tool') {
      return {
        ...item,
        buttonType: 'primary' as const,
        disabled: false
      }
    }

    if (item.type === 'action') {
      const disabledMap: Record<string, boolean> = {
        undo: !canUndo.value,
        redo: !canRedo.value
      }
      return {
        ...item,
        disabled: disabledMap[item.id] ?? false
      }
    }

    return item
  })
)

const handleToolbarAction = (item: ToolbarItem) => {
  if (item.disabled || item.type === 'separator') return

  if (item.type === 'tool') {
    setTool(item.id as any)
    return
  }

  const actionMap: Record<string, () => void> = {
    undo: handleUndo,
    redo: handleRedo,
    delete: handleDelete,
    clear: () => {
      clearCanvas(getCanvas())
      saveToHistory()
      message.success('画布已清空')
    },
    'zoom-out': () => handleZoom(-1),
    'zoom-in': () => handleZoom(1),
    'zoom-reset': resetZoom,
    export: openExportDialog,
    import: triggerFileInput
  }

  const action = actionMap[item.id]
  if (action) action()
}
</script>

<template>
  <div class="canvas-board flex flex-col h-full">
    <Toolbar
      :toolbar-items="toolbarItems"
      :current-tool="currentTool"
      :can-undo="canUndo"
      :can-redo="canRedo"
      @action="handleToolbarAction" />

    <div class="main-content flex-1 flex min-h-0">
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
      @confirm="handleExport"
      @cancel="closeExportDialog" />

    <input
      ref="fileInputRef"
      type="file"
      accept="image/png,image/jpeg,image/svg+xml"
      class="hidden"
      @change="handleFileImport" />
  </div>
</template>

<style scoped>
.canvas-board {
  height: 100%;
}
</style>

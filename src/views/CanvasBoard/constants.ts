/**
 * 画板常量定义
 */

/**
 * 默认画布配置
 */
export const DEFAULT_CANVAS_CONFIG = {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff'
} as const

/**
 * 默认对象属性配置
 */
export const DEFAULT_OBJECT_PROPERTIES = {
  fill: '#000000',
  stroke: '#000000',
  strokeWidth: 2,
  opacity: 1,
  strokeDashArray: []
} as const

/**
 * 最大历史记录数量
 */
export const MAX_HISTORY_SIZE = 30

/**
 * 自动保存间隔（毫秒）
 */
export const AUTO_SAVE_INTERVAL = 30000

/**
 * 支持的导入格式
 */
export const SUPPORTED_IMPORT_FORMATS = ['png', 'jpg', 'jpeg', 'svg'] as const

/**
 * 支持的导出格式
 */
export const SUPPORTED_EXPORT_FORMATS = [
  { label: 'PNG', value: 'png' },
  { label: 'JPG', value: 'jpeg' },
  { label: 'SVG', value: 'svg' }
] as const

/**
 * 线条样式选项
 */
export const STROKE_DASH_OPTIONS = [
  { label: '实线', value: [] },
  { label: '虚线', value: [5, 5] },
  { label: '点线', value: [2, 4] }
]

/**
 * 工具栏项目定义
 */
export interface ToolbarItem {
  id: string
  type: 'tool' | 'action' | 'separator'
  icon?: string
  tooltip?: string
  action?: () => void
  disabled?: boolean
  children?: ToolbarItem[]
}

/**
 * 属性面板项目定义
 */
export interface PropertyPanelItem {
  id: string
  name: string
  component: 'color' | 'slider' | 'select' | 'input'
  properties?: Record<string, unknown>
}

/**
 * 画板工具栏项目
 */
export const CANVAS_TOOLBAR_ITEMS: ToolbarItem[] = [
  {
    id: 'select',
    type: 'tool',
    icon: 'HandLeftOutline',
    tooltip: '选择工具'
  },
  {
    id: 'separator-1',
    type: 'separator'
  },
  {
    id: 'rect',
    type: 'tool',
    icon: 'SquareOutline',
    tooltip: '矩形'
  },
  {
    id: 'circle',
    type: 'tool',
    icon: 'RadioButtonOnOutline',
    tooltip: '圆形'
  },
  {
    id: 'ellipse',
    type: 'tool',
    icon: 'EllipseOutline',
    tooltip: '椭圆'
  },
  {
    id: 'line',
    type: 'tool',
    icon: 'LinkOutline',
    tooltip: '直线'
  },
  {
    id: 'polygon',
    type: 'tool',
    icon: 'CreateOutline',
    tooltip: '多边形'
  },
  {
    id: 'path',
    type: 'tool',
    icon: 'BrushOutline',
    tooltip: '自由绘制'
  },
  {
    id: 'text',
    type: 'tool',
    icon: 'TextOutline',
    tooltip: '文字'
  },
  {
    id: 'image',
    type: 'tool',
    icon: 'ImageOutline',
    tooltip: '插入图片'
  },
  {
    id: 'separator-2',
    type: 'separator'
  },
  {
    id: 'undo',
    type: 'action',
    icon: 'ArrowUndoOutline',
    tooltip: '撤销 (Ctrl+Z)'
  },
  {
    id: 'redo',
    type: 'action',
    icon: 'ArrowRedoOutline',
    tooltip: '恢复 (Ctrl+Y)'
  },
  {
    id: 'delete',
    type: 'action',
    icon: 'TrashOutline',
    tooltip: '删除 (Delete)'
  },
  {
    id: 'clear',
    type: 'action',
    icon: 'RemoveCircleOutline',
    tooltip: '清空画布'
  },
  {
    id: 'separator-3',
    type: 'separator'
  },
  {
    id: 'zoom-out',
    type: 'action',
    icon: 'ContractOutline',
    tooltip: '缩小'
  },
  {
    id: 'zoom-in',
    type: 'action',
    icon: 'ExpandOutline',
    tooltip: '放大'
  },
  {
    id: 'zoom-reset',
    type: 'action',
    icon: 'RefreshCircleOutline',
    tooltip: '重置视图'
  },
  {
    id: 'separator-4',
    type: 'separator'
  },
  {
    id: 'export',
    type: 'action',
    icon: 'DownloadOutline',
    tooltip: '导出画布'
  },
  {
    id: 'import',
    type: 'action',
    icon: 'FolderOpenOutline',
    tooltip: '导入图片'
  }
]

/**
 * 属性面板项目
 */
export const PROPERTY_PANEL_ITEMS: PropertyPanelItem[] = [
  {
    id: 'fill',
    name: '填充颜色',
    component: 'color',
    properties: {
      showAlpha: false,
      modes: ['hex']
    }
  },
  {
    id: 'stroke',
    name: '描边颜色',
    component: 'color',
    properties: {
      showAlpha: false,
      modes: ['hex']
    }
  },
  {
    id: 'strokeWidth',
    name: '线条宽度',
    component: 'slider',
    properties: {
      min: 1,
      max: 20,
      step: 1
    }
  },
  {
    id: 'opacity',
    name: '透明度',
    component: 'slider',
    properties: {
      min: 0,
      max: 1,
      step: 0.1
    }
  },
  {
    id: 'strokeDashArray',
    name: '线条样式',
    component: 'select',
    properties: {
      options: STROKE_DASH_OPTIONS
    }
  }
]

/**
 * 快捷键定义
 */
export const CANVAS_SHORTCUTS = [
  { key: 'z', ctrl: true, action: 'undo', description: '撤销' },
  { key: 'y', ctrl: true, action: 'redo', description: '恢复' },
  { key: 'Delete', action: 'delete', description: '删除选中' },
  { key: 'Backspace', action: 'delete', description: '删除选中' }
] as const

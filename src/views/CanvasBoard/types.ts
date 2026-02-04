/**
 * 画板应用核心类型定义
 */

/**
 * 绘图工具类型
 */
export type DrawingTool =
  | 'select'
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'path'
  | 'polygon'
  | 'text'

/**
 * 画布配置
 */
export interface CanvasConfig {
  width: number
  height: number
  backgroundColor: string
}

/**
 * 对象属性配置
 */
export interface ObjectProperties {
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  strokeDashArray: readonly number[]
}

/**
 * 历史记录状态
 */
export interface HistoryState {
  json: string
  timestamp: number
}

/**
 * 导出选项
 */
export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg'
  quality: number
  multiplier: number
}

/**
 * 导出格式类型
 */
export type ExportFormat = 'png' | 'jpg' | 'svg'

/**
 * 工具栏项目类型
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
 * 属性面板项目类型
 */
export interface PropertyPanelItem {
  id: string
  name: string
  component: 'color' | 'slider' | 'select' | 'input'
  properties?: Record<string, unknown>
}

/**
 * 快捷键定义
 */
export interface ShortcutDefinition {
  key: string
  ctrl?: boolean
  meta?: boolean
  action: string
  description: string
}

/**
 * 线条样式选项
 */
export interface StrokeDashOption {
  label: string
  value: number[]
}

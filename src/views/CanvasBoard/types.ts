/**
 * 画板应用核心类型定义
 */

import { FabricObject } from 'fabric'

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
  | 'image'

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
export type ExportFormat = 'png' | 'jpeg' | 'svg'

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

/**
 * 图片元素数据结构
 */
export interface ImageElement {
  id: string
  type: 'image'
  src: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
}

/**
 * 支持的图片格式
 */
export type SupportedImageFormat = 'png' | 'jpeg' | 'jpg' | 'webp' | 'gif' | 'bmp'

/**
 * 图片插入选项
 */
export interface ImageInsertOptions {
  x?: number
  y?: number
  maxWidth?: number
  maxHeight?: number
}

/**
 * Fabric.js 指针事件类型
 */
export type TPointerEvent = MouseEvent | TouchEvent | PointerEvent

/**
 * 画布事件数据基础接口
 */
export interface CanvasEventData<E extends Event = TPointerEvent> {
  e: E
}

/**
 * 鼠标按下事件数据
 */
export interface MouseDownEventData extends CanvasEventData<TPointerEvent> {
  target?: FabricObject | null
}

/**
 * 鼠标移动事件数据
 */
export interface MouseMoveEventData extends CanvasEventData<TPointerEvent> {
  target?: FabricObject | null
}

/**
 * 对象选择事件数据
 */
export interface ObjectSelectedEventData {
  target: FabricObject
  deselected?: FabricObject[]
  selected?: FabricObject[]
}

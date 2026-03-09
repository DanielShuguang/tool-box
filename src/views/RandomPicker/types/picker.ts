/**
 * 随机选择工具类型定义
 */

/** 选择模式 */
export type PickMode = 'normal' | 'sequential' | 'weighted'

/** 候选项 */
export interface Option {
  /** 唯一标识 */
  id: string
  /** 候选项名称 */
  name: string
  /** 权重（权重选择时使用，默认为 1） */
  weight: number
  /** 是否禁用 */
  disabled: boolean
  /** 分组标识（可选） */
  group?: string
}

/** 选择目标（顺序选择模式） */
export interface PickTarget {
  /** 唯一标识 */
  id: string
  /** 选择目标名称（如"第一选择"、"第二选择"） */
  name: string
  /** 选择数量 */
  count: number
  /** 选择顺序 */
  order: number
}

/** 选择配置 */
export interface PickerConfig {
  /** 选中后是否从候选项移除 */
  removeSelected: boolean
}

/** 选择结果 */
export interface PickResult {
  /** 结果 ID */
  id: string
  /** 选择时间戳 */
  timestamp: number
  /** 选择模式 */
  mode: PickMode
  /** 选择目标信息（顺序选择时） */
  target?: PickTarget
  /** 被选中的候选项 */
  selected: Option[]
  /** 选择配置 */
  config: PickerConfig
}

/** 导出格式 */
export type ExportFormat = 'json' | 'csv'

/** 导出范围 */
export type ExportRange = 'current' | 'all' | 'range'

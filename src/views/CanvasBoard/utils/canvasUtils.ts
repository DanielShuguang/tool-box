/**
 * 画布工具函数
 */

/**
 * 检查画布 JSON 是否包含实际内容
 *
 * 判断标准：
 * 1. objects 数组不为空
 * 2. objects 数组中包含非空对象
 * 3. 排除默认的白色背景画布
 *
 * @param canvasJson 画布 JSON 字符串
 * @returns 是否包含实际内容
 */
export function hasCanvasContent(canvasJson: string): boolean {
  try {
    const data = JSON.parse(canvasJson)

    // 检查是否有 objects 数组
    if (!data.objects || !Array.isArray(data.objects)) {
      return false
    }

    // 检查 objects 数组是否为空
    if (data.objects.length === 0) {
      return false
    }

    // 检查 objects 数组中是否有实际内容
    // 一个空的画布通常只有默认的配置，没有实际的对象
    const hasRealObjects = data.objects.some((obj: Record<string, unknown>) => {
      // 检查对象是否有有效的类型和属性
      if (!obj || typeof obj !== 'object') {
        return false
      }

      // 检查对象类型
      const type = obj.type
      if (!type || typeof type !== 'string') {
        return false
      }

      // 检查对象是否有有效的位置信息
      // Fabric.js 对象必须有 left 和 top 属性来定义位置
      const hasValidPosition = typeof obj.left === 'number' && typeof obj.top === 'number'

      // 如果对象有类型和有效的位置信息，则认为它是实际内容
      return hasValidPosition
    })

    return hasRealObjects
  } catch (error) {
    console.error('检查画布内容失败:', error)
    return false
  }
}

/**
 * 检查画布状态是否为空
 *
 * @param state 历史记录状态
 * @returns 是否为空状态
 */
export function isEmptyState(state: { json: string; timestamp: number } | null): boolean {
  if (!state || !state.json) {
    return true
  }

  return !hasCanvasContent(state.json)
}

/**
 * 获取默认的空画布 JSON
 *
 * @param width 画布宽度
 * @param height 画布高度
 * @param backgroundColor 背景颜色
 * @returns 默认空画布 JSON 字符串
 */
export function getEmptyCanvasJson(
  width: number = 800,
  height: number = 600,
  backgroundColor: string = '#ffffff'
): string {
  return JSON.stringify({
    version: '5.3.0',
    objects: [],
    background: backgroundColor,
    width,
    height
  })
}

/**
 * 生成唯一 ID
 * 使用时间戳和随机数组合生成
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

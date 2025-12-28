/**
 * 音频格式工具函数
 * 提供音频时间格式化和 MIME 类型获取功能
 */

/**
 * 将秒数格式化为 MM:SS 格式
 * @param seconds 音频时间（秒）
 * @returns 格式化后的时间字符串
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '00:00'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 根据文件扩展名获取 MIME 类型
 * @param filePath 文件路径
 * @returns MIME 类型字符串
 */
export function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    aac: 'audio/aac'
  }
  return mimeTypes[ext] || 'audio/mpeg'
}

import { format } from 'date-fns'

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化下载速度
 * @param bytesPerSecond 每秒字节数
 * @returns 格式化后的速度字符串
 */
export function formatSpeed(bytesPerSecond: number): string {
  return formatFileSize(bytesPerSecond) + '/s'
}

/**
 * 格式化时间
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
export function formatTime(seconds: number): string {
  if (seconds <= 0) return '--'
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}时${minutes}分`
}

/**
 * 格式化日期时间
 * @param timestamp 时间戳
 * @returns 格式化后的日期时间字符串
 */
export function formatDate(timestamp: number | null): string {
  if (!timestamp) return '--'
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm')
}

/**
 * 计算下载进度百分比
 * @param downloadedBytes 已下载字节数
 * @param totalBytes 总字节数
 * @returns 进度百分比 (0-100)
 */
export function calculateProgressPercentage(downloadedBytes: number, totalBytes: number): number {
  if (totalBytes <= 0) return 0
  return Math.round((downloadedBytes / totalBytes) * 10000) / 100
}

/**
 * 计算预计剩余时间
 * @param downloadedBytes 已下载字节数
 * @param totalBytes 总字节数
 * @param speed 下载速度 (字节/秒)
 * @returns 预计剩余秒数
 */
export function calculateETA(downloadedBytes: number, totalBytes: number, speed: number): number {
  if (speed <= 0 || downloadedBytes >= totalBytes) return 0
  return Math.ceil((totalBytes - downloadedBytes) / speed)
}

/**
 * 根据 ID 获取任务
 * @param tasks 任务列表
 * @param id 任务 ID
 * @returns 找到的任务或 undefined
 */
export function getTaskById<T extends { id: string }>(tasks: T[], id: string): T | undefined {
  return tasks.find(t => t.id === id)
}

/**
 * 过滤下载中任务 (pending, downloading, paused)
 * @param tasks 任务列表
 * @returns 下载中任务列表
 */
export function filterDownloadingTasks<T extends { status: string }>(tasks: T[]): T[] {
  return tasks.filter(t => ['pending', 'downloading', 'paused'].includes(t.status))
}

/**
 * 过滤已完成任务 (completed, failed, cancelled)
 * @param tasks 任务列表
 * @returns 已完成任务列表
 */
export function filterCompletedTasks<T extends { status: string }>(tasks: T[]): T[] {
  return tasks.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status))
}

/**
 * 搜索过滤任务
 * @param tasks 任务列表
 * @param keyword 搜索关键词
 * @returns 过滤后的任务列表
 */
export function searchTasks<T extends { url: string; fileName: string }>(
  tasks: T[],
  keyword: string
): T[] {
  if (!keyword.trim()) return tasks
  const lowerKeyword = keyword.toLowerCase()
  return tasks.filter(
    t =>
      t.url.toLowerCase().includes(lowerKeyword) || t.fileName.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 获取状态类型 (用于 UI 组件)
 * @param status 下载状态
 * @returns 对应的状态类型
 */
export function getStatusType(
  status: string
): 'info' | 'success' | 'error' | 'warning' | 'default' {
  switch (status) {
    case 'downloading':
      return 'info'
    case 'completed':
      return 'success'
    case 'failed':
      return 'error'
    case 'paused':
      return 'warning'
    default:
      return 'default'
  }
}

/**
 * 获取状态文本
 * @param status 下载状态
 * @returns 对应的状态文本
 */
export function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return '等待中'
    case 'downloading':
      return '下载中'
    case 'paused':
      return '已暂停'
    case 'completed':
      return '已完成'
    case 'failed':
      return '下载失败'
    case 'cancelled':
      return '已取消'
    default:
      return status
  }
}

/**
 * 格式化限速标签
 * @param limit 限速值 (字节/秒)
 * @returns 格式化后的限速字符串
 */
export function formatSpeedLimitLabel(limit: number | null): string {
  if (!limit) return '不限速'
  if (limit >= 1024 * 1024) {
    return `${(limit / (1024 * 1024)).toFixed(1)} MB/s`
  }
  return `${(limit / 1024).toFixed(0)} KB/s`
}

/**
 * 将限速从 MB/s 转换为字节/秒
 * @param mbPerSecond MB/s 值
 * @returns 字节/秒，0 或 null 表示不限速
 */
export function speedLimitMBToBytes(mbPerSecond: string | number | null): number | null {
  if (mbPerSecond === null || mbPerSecond === '') return null
  const val = typeof mbPerSecond === 'string' ? parseFloat(mbPerSecond) : mbPerSecond
  if (!val || val <= 0) return null
  return Math.round(val * 1024 * 1024)
}

/**
 * 将限速从字节/秒转换为 MB/s
 * @param bytesPerSecond 字节/秒
 * @returns MB/s 字符串，空字符串表示不限速
 */
export function speedLimitBytesToMB(bytesPerSecond: number | null): string {
  if (!bytesPerSecond) return ''
  return (bytesPerSecond / (1024 * 1024)).toFixed(2)
}

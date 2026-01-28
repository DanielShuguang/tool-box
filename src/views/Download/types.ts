/** 下载任务状态 */
export type DownloadStatus =
  | 'pending' // 等待中
  | 'downloading' // 下载中
  | 'paused' // 已暂停
  | 'completed' // 已完成
  | 'failed' // 下载失败
  | 'cancelled' // 已取消

/** 下载任务分类 */
export type DownloadCategory = 'downloading' | 'completed'

/** 下载进度信息 */
export interface DownloadProgress {
  /** 已下载字节数 */
  downloadedBytes: number
  /** 总字节数 */
  totalBytes: number
  /** 下载速度（字节/秒） */
  speed: number
  /** 进度百分比 */
  percentage: number
  /** 预计剩余时间（秒） */
  eta: number
}

/** 下载任务 */
export interface DownloadTask {
  /** 任务唯一ID */
  id: string
  /** 下载URL */
  url: string
  /** 文件名（如果为空则从URL或响应头获取） */
  fileName: string
  /** 保存目录 */
  saveDir: string
  /** 完整保存路径 */
  savePath: string
  /** 任务状态 */
  status: DownloadStatus
  /** 进度信息 */
  progress: DownloadProgress
  /** 已下载的字节数（用于断点续传） */
  downloadedBytes: number
  /** 总字节数 */
  totalBytes: number
  /** 创建时间 */
  createdAt: number
  /** 开始下载时间 */
  startedAt: number | null
  /** 完成时间 */
  completedAt: number | null
  /** 错误信息 */
  errorMessage: string | null
  /** 限速（字节/秒，null表示不限速） */
  speedLimit: number | null
  /** 重试次数 */
  retryCount: number
  /** HTTP响应码 */
  responseCode: number | null
  /** ETag */
  etag: string | null
  /** 最后修改时间 */
  lastModified: string | null
}

/** 新建下载任务的输入 */
export interface CreateDownloadInput {
  /** 下载URL */
  url: string
  /** 保存目录（可选，如果不提供则使用默认目录） */
  saveDir?: string
  /** 文件名（可选，如果不提供则自动获取） */
  fileName?: string
  /** 限速（字节/秒） */
  speedLimit?: number | null
}

/** 下载任务筛选条件 */
export interface DownloadFilter {
  /** 状态筛选 */
  status?: DownloadStatus[]
  /** 分类筛选 */
  category?: DownloadCategory
  /** 搜索关键词 */
  keyword?: string
}

/** 全局下载设置 */
export interface DownloadSettings {
  /** 默认下载目录 */
  defaultDir: string
  /** 同时下载的最大任务数 */
  maxConcurrent: number
  /** 默认限速（字节/秒，null表示不限速） */
  defaultSpeedLimit: number | null
  /** 下载完成后是否打开文件 */
  openAfterComplete: boolean
  /** 是否监听剪贴板自动创建下载任务 */
  clipboardMonitor: boolean
}

/** 下载进度信息 */
export interface DownloadProgressInfo {
  downloadedBytes: number
  totalBytes: number
  speed: number
  percentage: number
  eta: number
}

/** 下载任务 */
export interface DownloadTaskRecord {
  id: string
  url: string
  fileName: string
  saveDir: string
  savePath: string
  status: string
  progress: DownloadProgressInfo
  downloadedBytes: number
  totalBytes: number
  createdAt: number
  startedAt: number | null
  completedAt: number | null
  errorMessage: string | null
  speedLimit: number | null
  retryCount: number
  responseCode: number | null
  etag: string | null
  lastModified: string | null
}

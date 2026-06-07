export interface DownloadFilePayload {
  concurrent: number
  dirPath: string
  url: string
  pluginName: string
}

export interface DownloadConfig {
  concurrent: number
  dirPath: string
  url: string
  pluginName: string
  fileName?: string
  eventType?: string
  speedLimitMbps?: number
}

/** 断点续传下载信息 */
export interface ResumeDownloadInfo {
  /** 原始文件路径 */
  filePath: string
  /** 文件名 */
  fileName: string
  /** 临时文件路径 */
  tempFilePath: string
  /** 下载URL */
  url: string
  /** 已下载字节数 */
  downloadedBytes: number
  /** 总字节数 */
  totalBytes: number
  /** ETag */
  etag: string | null
  /** 最后修改时间 */
  lastModified: string | null
}

/** 服务器 Range 支持检查结果 */
export interface RangeSupportResult {
  /** 是否支持 Range 请求 */
  supportsRange: boolean
  /** 文件总大小 */
  totalBytes: number
  /** ETag */
  etag: string | null
  /** 最后修改时间 */
  lastModified: string | null
}

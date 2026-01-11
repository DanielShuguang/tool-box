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

export interface DownloadProgress {
  current: number
  total: number
  percentage: number
  speedMbps: number
  status: 'starting' | 'downloading' | 'paused' | 'resumed' | 'completed' | 'failed'
}

export interface DownloadFilePayload {
  concurrent: number
  dir_path: string
  url: string
  plugin_name: string
}

export interface DownloadConfig {
  concurrent: number
  dir_path: string
  url: string
  plugin_name: string
  file_name?: string
  event_type?: string
  speed_limit_mbps?: number
}

export interface DownloadProgress {
  current: number
  total: number
  percentage: number
  speed_mbps: number
  status: 'starting' | 'downloading' | 'paused' | 'resumed' | 'completed' | 'failed'
}

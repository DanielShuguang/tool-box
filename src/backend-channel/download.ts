import { invoke } from '@tauri-apps/api/core'
import { DownloadFilePayload, DownloadConfig } from './models/download'
import { BackendResp } from '@/types/common'
import type { ResumeDownloadInfo, RangeSupportResult } from '@/views/Download/types'

/** 下载文件 - 基础版本 */
export async function downloadFile(payload: DownloadFilePayload) {
  return invoke<BackendResp<string>>('download_file', {
    payload
  })
}

/** 下载文件 - 完整配置版本 */
export async function downloadFileWithConfig(config: DownloadConfig) {
  return invoke<BackendResp<string>>('download_file_with_config', {
    config
  })
}

/** 扫描未完成的下载文件 */
export async function scanUnfinishedDownloads(filePath: string) {
  return invoke<BackendResp<ResumeDownloadInfo[]>>('scan_unfinished_downloads', {
    filePath
  })
}

/** 检查服务器是否支持断点续传 */
export async function checkServerRangeSupport(url: string) {
  return invoke<BackendResp<RangeSupportResult>>('check_server_range_support', {
    url
  })
}

import { invoke } from '@tauri-apps/api/core'
import { DownloadFilePayload, DownloadConfig } from './models/download'
import { BackendResp } from '@/types/common'

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

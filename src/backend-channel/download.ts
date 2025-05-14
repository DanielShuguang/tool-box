import { invoke } from '@tauri-apps/api/core'
import { DownloadFilePayload } from './models/download'
import { BackendResp } from '@/types/common'

/** 下载文件 */
export async function downloadFile(payload: DownloadFilePayload) {
  return invoke<BackendResp<string>>('download_file', {
    payload
  })
}

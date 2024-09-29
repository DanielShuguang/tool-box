import { invoke } from '@tauri-apps/api'
import { DownloadFilePayload } from './models/download'

/** 下载文件 */
export async function downloadFile(params: DownloadFilePayload) {
  return invoke<BackendResp<string>>('plugin:download|download_file', {
    payload: params
  })
}

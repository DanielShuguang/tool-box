import { invoke } from '@tauri-apps/api/core'
import { FileSearchPayload } from './models/file-search'

/** 在磁盘中搜索文件 */
export function searchHarddiskFile(payload: FileSearchPayload) {
  return invoke('search_disk_file_real_time', { payload })
}

export function cancelSearchTask() {
  return invoke('cancel_search_task')
}

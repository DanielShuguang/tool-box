import { invoke } from '@tauri-apps/api/core'

export function getCpuCoreCount() {
  return invoke<number>('get_cpu_info')
}

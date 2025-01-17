import { invoke } from '@tauri-apps/api/core'

export function getCpuCoreCount() {
  return invoke<number>('get_cpu_info')
}

export function getHarddiskInfo() {
  return invoke<string[]>('get_harddisk_info')
}

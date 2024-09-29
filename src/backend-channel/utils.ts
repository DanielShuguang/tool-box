import { invoke } from '@tauri-apps/api'

export function getCpuCoreCount() {
  return invoke<number>('plugin:os|get_cpu_info')
}

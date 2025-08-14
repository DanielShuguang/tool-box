import { invoke } from '@tauri-apps/api/core'
import { BackendResp } from '@/types/common'

export function isAutoStartEnabled() {
  return invoke<BackendResp<{ enabled: boolean }>>('is_auto_start_enabled')
}

export function setAutoStart(enable: boolean) {
  return invoke<BackendResp<string>>('set_auto_start', {
    payload: { enable, plugin_name: 'autostart' }
  })
}

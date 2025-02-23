import { platform } from '@tauri-apps/plugin-os'

export function getSep() {
  const os = platform()
  if (os === 'windows') {
    return '\\'
  }
  return '/'
}

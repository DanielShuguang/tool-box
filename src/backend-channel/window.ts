import { invoke } from '@tauri-apps/api/core'

export interface WindowEvent {
  eventType: string
  data: Record<string, any>
}

export async function createWindow(label: string): Promise<void> {
  await invoke(`create_${label}`)
}

export async function closeWindow(label: string): Promise<void> {
  await invoke(`close_${label}`)
}

export async function sendEventToWindow(
  label: string,
  eventType: string,
  data: Record<string, any> = {}
): Promise<void> {
  await invoke(`send_${label}_to_window`, {
    eventType,
    data
  })
}

export async function isWindowOpen(label: string): Promise<boolean> {
  return await invoke<boolean>(`is_${label}_open`)
}

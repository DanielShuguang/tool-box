import { invoke } from '@tauri-apps/api/core'
import {
  ReadAudioFilePayload,
  ScanAudioFolderPayload,
  BackendAudioFile
} from './models/music-player'

export type AudioData = ArrayBuffer

export async function readAudioFile(payload: ReadAudioFilePayload): Promise<AudioData> {
  const arr = await invoke<number[]>('read_audio_file', { ...payload })
  return new Uint8Array(arr).buffer
}

/** 扫描音频文件夹 */
export function scanAudioFolder(payload: ScanAudioFolderPayload) {
  return invoke<BackendAudioFile[]>('scan_audio_folder', { ...payload })
}

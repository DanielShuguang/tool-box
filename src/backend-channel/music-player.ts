import { invoke } from '@tauri-apps/api/core'
import {
  ReadAudioFilePayload,
  ScanAudioFolderPayload,
  BackendAudioFile
} from './models/music-player'

export type AudioData = ArrayBuffer

export function readAudioFile(payload: ReadAudioFilePayload): Promise<AudioData> {
  return invoke<number[]>('read_audio_file', { ...payload }).then(arr => new Uint8Array(arr).buffer)
}

/** 扫描音频文件夹 */
export function scanAudioFolder(payload: ScanAudioFolderPayload) {
  return invoke<BackendAudioFile[]>('scan_audio_folder', { ...payload })
}

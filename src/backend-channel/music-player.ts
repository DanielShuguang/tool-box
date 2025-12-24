import { invoke } from '@tauri-apps/api/core'
import {
  ReadAudioFilePayload,
  ScanAudioFolderPayload,
  BackendAudioFile
} from './models/music-player'

/** 读取音频文件 */
export function readAudioFile(payload: ReadAudioFilePayload) {
  return invoke<string>('read_audio_file', { ...payload })
}

/** 扫描音频文件夹 */
export function scanAudioFolder(payload: ScanAudioFolderPayload) {
  return invoke<BackendAudioFile[]>('scan_audio_folder', { ...payload })
}

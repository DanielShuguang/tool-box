export interface ReadAudioFilePayload {
  filePath: string
}

export interface ScanAudioFolderPayload {
  folderPath: string
}

export interface BackendAudioFile {
  id: string
  name: string
  path: string
  title: string
  artist?: string
  album?: string
}

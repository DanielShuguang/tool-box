import { open } from '@tauri-apps/plugin-dialog'
import { useMessage } from 'naive-ui'
import { scanAudioFolder } from '@/backend-channel/music-player'
import type { AudioFile } from './usePlaylist'

export function useFileLoader() {
  const message = useMessage()

  async function selectFolder(): Promise<string | null> {
    try {
      const result = await open({
        directory: true,
        multiple: false,
        title: '选择音乐文件夹'
      })

      if (typeof result === 'string') {
        return result
      }
      return null
    } catch (err) {
      message.error('文件夹选择失败')
      console.error(err)
      return null
    }
  }

  async function loadFilesFromFolder(folderPath: string): Promise<AudioFile[]> {
    try {
      const result = await scanAudioFolder({ folderPath })

      if (!result || result.length === 0) {
        message.warning('文件夹中没有找到支持的音频文件')
        return []
      }

      const playlist = result.map(file => ({
        ...file,
        duration: undefined
      }))
      message.success(`已加载 ${result.length} 首歌曲`)
      return playlist
    } catch (err) {
      message.error('加载文件失败')
      console.error(err)
      return []
    }
  }

  return {
    selectFolder,
    loadFilesFromFolder
  }
}

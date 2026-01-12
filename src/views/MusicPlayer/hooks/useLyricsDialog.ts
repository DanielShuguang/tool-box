import { useMessage } from 'naive-ui'
import { getTrackTitle, getTrackArtist } from '../utils/musicUtils'

export function useLyricsDialog(
  saveManualLyrics: (trackId: string, lyrics: any[], meta: any) => Promise<void>,
  saveCache: (trackId: string, data: any) => Promise<boolean>
) {
  const message = useMessage()
  const editDialogShow = ref(false)
  const uploadDialogShow = ref(false)

  function handleEditLyrics(currentTrack: any) {
    if (!currentTrack) {
      message.warning('请先播放音乐')
      return
    }
    editDialogShow.value = true
  }

  function handleUploadLyrics(currentTrack: any) {
    if (!currentTrack) {
      message.warning('请先播放音乐')
      return
    }
    uploadDialogShow.value = true
  }

  async function handleSaveEditedLyrics(track: any, lyrics: { time: number; text: string }[]) {
    if (!track) return

    try {
      await saveManualLyrics(track.id, lyrics, {
        title: getTrackTitle(track),
        artist: getTrackArtist(track)
      })

      const lyricsData = {
        trackId: track.id,
        songName: getTrackTitle(track),
        artist: getTrackArtist(track),
        source: 'Manual' as const,
        format: 'lrc' as const,
        cachedAt: new Date().toISOString(),
        lyrics
      }

      await saveCache(track.id, lyricsData)
      message.success('歌词已保存')
    } catch (error) {
      message.error('保存歌词失败')
      console.error('保存歌词失败:', error)
    }
  }

  async function handleSaveUploadedLyrics(track: any, lyrics: { time: number; text: string }[]) {
    if (!track) return

    try {
      const lyricsData = {
        trackId: track.id,
        songName: getTrackTitle(track),
        artist: getTrackArtist(track),
        source: 'Upload' as const,
        format: 'lrc' as const,
        cachedAt: new Date().toISOString(),
        lyrics
      }

      await saveCache(track.id, lyricsData)
      message.success('歌词已上传并保存')
    } catch (error) {
      message.error('保存歌词失败')
      console.error('保存歌词失败:', error)
    }
  }

  return {
    editDialogShow,
    uploadDialogShow,
    handleEditLyrics,
    handleUploadLyrics,
    handleSaveEditedLyrics,
    handleSaveUploadedLyrics
  }
}

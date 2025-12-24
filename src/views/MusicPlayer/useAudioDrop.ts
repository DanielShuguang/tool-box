import type { AudioFile } from './usePlaylist'

export function useAudioDrop() {
  const message = useMessage()
  const isDragging = ref(false)

  const supportedFormats = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac']

  function handleDrop(e: DragEvent): AudioFile[] {
    e.preventDefault()
    isDragging.value = false

    const files = Array.from(e.dataTransfer?.files || [])
    const audioFiles: AudioFile[] = []

    for (const file of files) {
      if (supportedFormats.some(ext => file.name.toLowerCase().endsWith(ext))) {
        audioFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          path: (file as any).path || file.name,
          title: file.name.replace(/\.[^/.]+$/, '')
        })
      }
    }

    if (audioFiles.length === 0) {
      message.warning('没有找到支持的音频文件')
    } else {
      message.success(`已添加 ${audioFiles.length} 首歌曲`)
    }

    return audioFiles
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    isDragging.value = true
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    isDragging.value = false
  }

  return {
    isDragging,
    handleDrop,
    handleDragOver,
    handleDragLeave
  }
}

import type { AudioFile } from './usePlaylist'

/**
 * 音频文件拖拽处理 Hook
 * 处理音频文件的拖拽放置事件，支持多种音频格式
 */
export function useAudioDrop() {
  const message = useMessage()

  /** 是否正在拖拽状态 */
  const isDragging = ref(false)

  /** 支持的音频文件格式列表 */
  const supportedFormats = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac']

  /**
   * 处理音频文件放置事件
   * 解析拖拽的文件，过滤出支持的音频格式并转换为 AudioFile 对象
   * @param e 拖拽事件对象
   * @returns 解析后的音频文件数组
   */
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

  /**
   * 处理拖拽经过事件
   * 标记拖拽进入状态，显示拖拽提示
   * @param e 拖拽事件对象
   */
  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    isDragging.value = true
  }

  /**
   * 处理拖拽离开事件
   * 清除拖拽状态
   * @param e 拖拽事件对象
   */
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

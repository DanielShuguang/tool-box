import { onMounted } from 'vue'
import { useAudioCore } from './useAudioCore'
import { usePlaylist } from './usePlaylist'
import { usePlayMode } from './usePlayMode'
import { useVolume } from './useVolume'
import { useFileLoader } from './useFileLoader'
import { useAudioDrop } from './useAudioDrop'
import type { AudioFile } from './usePlaylist'

export function useAudioPlayer() {
  const audioCore = useAudioCore()
  const playlist = usePlaylist()
  const playMode = usePlayMode()
  const volume = useVolume()
  const fileLoader = useFileLoader()
  const audioDrop = useAudioDrop()

  function handleTrackEnded() {
    if (playMode.playMode.value === 'loop') {
      playTrack(playlist.currentIndex.value)
    } else if (playMode.playMode.value === 'random') {
      playRandomTrack()
    } else {
      playNextTrack()
    }
  }

  audioCore.onTrackEnded(handleTrackEnded)

  async function playTrack(sortedIndex: number) {
    if (sortedIndex < 0 || sortedIndex >= playlist.sortedPlaylist.value.length) return

    const track = playlist.sortedPlaylist.value[sortedIndex]
    const originalIndex = playlist.playlist.value.findIndex(t => t.id === track.id)
    if (originalIndex !== -1) {
      playlist.updateCurrentIndex(originalIndex)
      await audioCore.playTrack(track)
    }
  }

  function playRandomTrack() {
    if (playlist.playlist.value.length === 0) return

    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * playlist.playlist.value.length)
    } while (randomIndex === playlist.currentIndex.value && playlist.playlist.value.length > 1)

    playTrack(randomIndex)
  }

  function playNextTrack() {
    if (playlist.playlist.value.length === 0) return

    let nextIndex = playlist.currentIndex.value + 1
    if (nextIndex >= playlist.playlist.value.length) {
      nextIndex = 0
    }
    playTrack(nextIndex)
  }

  function playPreviousTrack() {
    if (playlist.playlist.value.length === 0) return

    let prevIndex = playlist.currentIndex.value - 1
    if (prevIndex < 0) {
      prevIndex = playlist.playlist.value.length - 1
    }
    playTrack(prevIndex)
  }

  function setVolume(vol: number) {
    volume.setVolume(vol)
    audioCore.setVolume(vol)
  }

  async function selectFolder() {
    const folderPath = await fileLoader.selectFolder()
    if (folderPath) {
      const newPlaylist = await fileLoader.loadFilesFromFolder(folderPath)
      if (newPlaylist.length > 0) {
        playlist.updatePlaylist(newPlaylist)
        playlist.updateCurrentIndex(0)
        if (!audioCore.isPlaying.value) {
          playTrack(0)
        }
      }
    }
  }

  function handleFileDrop(files: File[]) {
    const audioFiles: AudioFile[] = []

    for (const file of files) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')

      // 尝试从文件名中提取艺术家和标题信息
      // 支持格式: "艺术家 - 标题" 或 "艺术家 - 专辑 - 标题"
      let title = fileNameWithoutExt
      let artist: string | undefined

      const hyphenIndex = fileNameWithoutExt.indexOf(' - ')
      if (hyphenIndex !== -1) {
        artist = fileNameWithoutExt.substring(0, hyphenIndex).trim()
        title = fileNameWithoutExt.substring(hyphenIndex + 3).trim()
      }

      audioFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        path: (file as any).path || file.name,
        title,
        artist
      })
    }

    if (audioFiles.length === 0) return

    playlist.addToPlaylist(audioFiles)

    if (!playlist.currentTrack.value && audioFiles.length > 0) {
      playTrack(0)
    }
  }

  function removeTrack(sortedIndex: number) {
    if (sortedIndex < 0 || sortedIndex >= playlist.sortedPlaylist.value.length) return

    const track = playlist.sortedPlaylist.value[sortedIndex]
    const originalIndex = playlist.playlist.value.findIndex(t => t.id === track.id)
    if (originalIndex === -1) return

    playlist.removeFromPlaylist(originalIndex)

    if (playlist.playlist.value.length === 0) {
      audioCore.stop()
      playlist.updateCurrentIndex(0)
    } else if (originalIndex === playlist.currentIndex.value) {
      const newIndex = Math.min(originalIndex, playlist.playlist.value.length - 1)
      playTrack(newIndex)
    } else if (originalIndex < playlist.currentIndex.value) {
      playlist.updateCurrentIndex(playlist.currentIndex.value - 1)
    }
  }

  function clearPlaylist() {
    playlist.clearPlaylist()
    audioCore.stop()
  }

  onMounted(() => {
    audioCore.setVolume(volume.volume.value)
  })

  return {
    audio: audioCore.audio,
    isPlaying: audioCore.isPlaying,
    currentTime: audioCore.currentTime,
    duration: audioCore.duration,
    volume: volume.volume,
    playMode: playMode.playMode,
    currentIndex: playlist.currentIndex,
    playlist: playlist.sortedPlaylist,
    originalPlaylist: playlist.playlist,
    currentTrack: playlist.currentTrack,
    isDragging: audioDrop.isDragging,
    sortOption: playlist.sortOption,
    sortOrder: playlist.sortOrder,
    playTrack,
    togglePlay: audioCore.togglePlay,
    playNextTrack,
    playPreviousTrack,
    seekTo: audioCore.seekTo,
    setVolume,
    togglePlayMode: playMode.togglePlayMode,
    selectFolder,
    handleFileDrop,
    removeTrack,
    clearPlaylist,
    setSortOption: playlist.setSortOption,
    formatTime: audioCore.formatTime
  }
}

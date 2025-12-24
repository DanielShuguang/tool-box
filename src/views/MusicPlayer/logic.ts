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

  async function playTrack(index: number) {
    if (index < 0 || index >= playlist.playlist.value.length) return

    playlist.updateCurrentIndex(index)
    const track = playlist.playlist.value[index]
    await audioCore.playTrack(track)
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
      audioFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        path: (file as any).path || file.name,
        title: file.name.replace(/\.[^/.]+$/, '')
      })
    }

    if (audioFiles.length === 0) return

    playlist.addToPlaylist(audioFiles)

    if (!playlist.currentTrack.value && audioFiles.length > 0) {
      playTrack(0)
    }
  }

  function removeTrack(index: number) {
    if (index < 0 || index >= playlist.playlist.value.length) return

    playlist.removeFromPlaylist(index)

    if (playlist.playlist.value.length === 0) {
      audioCore.stop()
      playlist.updateCurrentIndex(0)
    } else if (index === playlist.currentIndex.value) {
      const newIndex = Math.min(index, playlist.playlist.value.length - 1)
      playTrack(newIndex)
    } else if (index < playlist.currentIndex.value) {
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
    playlist: playlist.playlist,
    currentTrack: playlist.currentTrack,
    isDragging: audioDrop.isDragging,
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
    formatTime: audioCore.formatTime
  }
}

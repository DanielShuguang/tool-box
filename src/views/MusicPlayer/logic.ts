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

  function getNextTrackId(): string | null {
    if (playlist.playlist.value.length === 0) return null

    const currentId = playlist.currentTrackId.value
    const sortedList = playlist.sortedPlaylist.value

    if (!currentId) {
      return sortedList[0]?.id || null
    }

    const currentSortedIndex = sortedList.findIndex(t => t.id === currentId)
    if (currentSortedIndex === -1) {
      return sortedList[0]?.id || null
    }

    const nextSortedIndex = (currentSortedIndex + 1) % sortedList.length
    return sortedList[nextSortedIndex]?.id || null
  }

  function getPreviousTrackId(): string | null {
    if (playlist.playlist.value.length === 0) return null

    const currentId = playlist.currentTrackId.value
    const sortedList = playlist.sortedPlaylist.value

    if (!currentId) {
      return sortedList[sortedList.length - 1]?.id || null
    }

    const currentSortedIndex = sortedList.findIndex(t => t.id === currentId)
    if (currentSortedIndex === -1) {
      return sortedList[sortedList.length - 1]?.id || null
    }

    const prevSortedIndex = currentSortedIndex - 1
    if (prevSortedIndex < 0) {
      return sortedList[sortedList.length - 1]?.id || null
    }

    return sortedList[prevSortedIndex]?.id || null
  }

  function handleTrackEnded() {
    if (playMode.playMode.value === 'loop') {
      const currentId = playlist.currentTrackId.value
      if (currentId) {
        playTrack(currentId)
      }
    } else if (playMode.playMode.value === 'random') {
      playNextTrack()
    } else {
      const nextId = getNextTrackId()
      if (nextId) {
        playTrack(nextId)
      }
    }
  }

  audioCore.onTrackEnded(handleTrackEnded)

  async function playTrack(trackId: string) {
    const track = playlist.playlist.value.find(t => t.id === trackId)
    if (!track) return

    await audioCore.playTrack(track)
    playlist.updateCurrentTrackId(trackId)
  }

  function playNextTrack() {
    const nextId = getNextTrackId()
    if (nextId) {
      playTrack(nextId)
    }
  }

  function playPreviousTrack() {
    const prevId = getPreviousTrackId()
    if (prevId) {
      playTrack(prevId)
    }
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
        const firstTrackId = newPlaylist[0].id
        playlist.updateCurrentTrackId(firstTrackId)
        if (!audioCore.isPlaying.value) {
          playTrack(firstTrackId)
        }
      }
    }
  }

  function handleFileDrop(files: File[]) {
    const audioFiles: AudioFile[] = []

    for (const file of files) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')

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
      playTrack(audioFiles[0].id)
    }
  }

  function removeTrack(trackId: string) {
    const originalIndex = playlist.playlist.value.findIndex(t => t.id === trackId)
    if (originalIndex === -1) return

    playlist.removeFromPlaylist(originalIndex)

    const currentId = playlist.currentTrackId.value

    if (playlist.playlist.value.length === 0) {
      audioCore.stop()
      playlist.updateCurrentTrackId(null)
    } else if (currentId === trackId) {
      const remainingTrack = playlist.playlist.value[0]
      if (remainingTrack) {
        playTrack(remainingTrack.id)
      }
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
    isLoading: audioCore.isLoading,
    currentTime: audioCore.currentTime,
    duration: audioCore.duration,
    volume: volume.volume,
    playMode: playMode.playMode,
    currentTrackId: playlist.currentTrackId,
    playlist: playlist.sortedPlaylist,
    filteredPlaylist: playlist.filteredPlaylist,
    originalPlaylist: playlist.playlist,
    currentTrack: playlist.currentTrack,
    isDragging: audioDrop.isDragging,
    sortOption: playlist.sortOption,
    sortOrder: playlist.sortOrder,
    searchQuery: playlist.searchQuery,
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
    setSearchQuery: playlist.setSearchQuery,
    formatTime: audioCore.formatTime
  }
}

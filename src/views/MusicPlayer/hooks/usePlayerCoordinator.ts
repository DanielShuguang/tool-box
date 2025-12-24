import type { AudioFile, SortOption } from './usePlaylist'

export interface UsePlayerCoordinatorOptions {
  playlist: ReturnType<typeof import('./usePlaylist').usePlaylist>
  audioCore: ReturnType<typeof import('./useAudioCore').useAudioCore>
  playMode: ReturnType<typeof import('./usePlayMode').usePlayMode>
  volume: ReturnType<typeof import('./useVolume').useVolume>
  fileLoader: ReturnType<typeof import('./useFileLoader').useFileLoader>
  progress: ReturnType<typeof import('./usePlaybackProgress').usePlaybackProgress>
  isPlaying: Ref<boolean>
  currentTrack: ComputedRef<AudioFile | null>
}

export function usePlayerCoordinator(options: UsePlayerCoordinatorOptions) {
  const { playlist, audioCore, playMode, volume, fileLoader, progress, isPlaying, currentTrack } =
    options

  function getNextTrackId(): string | null {
    if (playlist.playlist.value.length === 0) return null
    const currentId = playlist.currentTrackId.value
    const sortedList = playlist.sortedPlaylist.value
    if (!currentId) return sortedList[0]?.id || null
    const currentSortedIndex = sortedList.findIndex(t => t.id === currentId)
    if (currentSortedIndex === -1) return sortedList[0]?.id || null
    const nextSortedIndex = (currentSortedIndex + 1) % sortedList.length
    return sortedList[nextSortedIndex]?.id || null
  }

  function getPreviousTrackId(): string | null {
    if (playlist.playlist.value.length === 0) return null
    const currentId = playlist.currentTrackId.value
    const sortedList = playlist.sortedPlaylist.value
    if (!currentId) return sortedList[sortedList.length - 1]?.id || null
    const currentSortedIndex = sortedList.findIndex(t => t.id === currentId)
    if (currentSortedIndex === -1) return sortedList[sortedList.length - 1]?.id || null
    const prevSortedIndex = currentSortedIndex - 1
    if (prevSortedIndex < 0) return sortedList[sortedList.length - 1]?.id || null
    return sortedList[prevSortedIndex]?.id || null
  }

  function handleTrackEnded() {
    if (playMode.playMode.value === 'single') {
      const currentId = playlist.currentTrackId.value
      if (currentId) {
        audioCore.seekTo(0)
        playTrack(currentId)
      }
    } else if (playMode.playMode.value === 'loop') {
      const currentId = playlist.currentTrackId.value
      if (currentId) {
        playTrack(currentId)
      }
    } else if (playMode.playMode.value === 'random') {
      playNextTrack()
    } else {
      const nextId = getNextTrackId()
      if (nextId) playTrack(nextId)
    }
  }

  async function playTrack(trackId: string) {
    const track = playlist.playlist.value.find(t => t.id === trackId)
    if (!track) return
    progress.setCurrentTrack(trackId)
    const savedProgress = progress.getProgress(trackId)
    await audioCore.playTrack(track)
    playlist.updateCurrentTrackId(trackId)
    if (savedProgress > 0 && savedProgress < (audioCore.duration.value || 0) - 5) {
      audioCore.seekTo(savedProgress)
    }
  }

  function playNextTrack() {
    const nextId = getNextTrackId()
    if (nextId) playTrack(nextId)
  }

  function playPreviousTrack() {
    const prevId = getPreviousTrackId()
    if (prevId) playTrack(prevId)
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
        if (!isPlaying.value) {
          playTrack(firstTrackId)
        }
      }
    }
  }

  function handleFileDrop(files: File[]) {
    const audioFiles = files
      .filter(file => {
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
        return ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac'].includes(ext)
      })
      .map(file => {
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        let title = fileNameWithoutExt
        let artist: string | undefined
        const hyphenIndex = fileNameWithoutExt.indexOf(' - ')
        if (hyphenIndex !== -1) {
          artist = fileNameWithoutExt.substring(0, hyphenIndex).trim()
          title = fileNameWithoutExt.substring(hyphenIndex + 3).trim()
        }
        return {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          path: (file as any).path || file.name,
          title,
          artist
        }
      })
    if (audioFiles.length === 0) return
    playlist.addToPlaylist(audioFiles)
    if (!currentTrack.value && audioFiles.length > 0) {
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
      if (remainingTrack) playTrack(remainingTrack.id)
    }
  }

  function clearPlaylist() {
    playlist.clearPlaylist()
    audioCore.stop()
  }

  function setSortOption(option: SortOption) {
    playlist.setSortOption(option)
  }

  function saveProgress(time: number) {
    const trackId = playlist.currentTrackId.value
    if (trackId && time > 0) {
      progress.saveProgress(trackId, time)
    }
  }

  audioCore.onTrackEnded(handleTrackEnded)

  return {
    getNextTrackId,
    getPreviousTrackId,
    playTrack,
    playNextTrack,
    playPreviousTrack,
    setVolume,
    selectFolder,
    handleFileDrop,
    removeTrack,
    clearPlaylist,
    setSortOption,
    saveProgress
  }
}

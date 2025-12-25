import type { AudioFile, SortOption } from './usePlaylist'

/**
 * 播放器协调器选项
 */
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

/**
 * 播放器协调器 Hook
 * 协调各模块功能，处理播放逻辑、进度保存、文件操作等核心业务流程
 */
export function usePlayerCoordinator(options: UsePlayerCoordinatorOptions) {
  const { playlist, audioCore, playMode, volume, fileLoader, progress, isPlaying, currentTrack } =
    options

  const recentPlayedIds = ref<string[]>([])
  const nextTrackIdRef = ref<string | null>(null)

  function getMaxRecentCount(): number {
    const total = playlist.playlist.value.length
    const count = Math.ceil(total / 3)
    return Math.min(Math.max(count, 30), total)
  }

  watch(
    () => playMode.playMode.value,
    (mode, prevMode) => {
      if (mode === 'random') {
        recentPlayedIds.value = []
      } else if (prevMode === 'random') {
        recentPlayedIds.value = []
      }
    }
  )

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

  async function triggerPreload() {
    if (playMode.playMode.value === 'single') return
    if (playMode.playMode.value === 'loop') return

    const nextId = getNextTrackId()
    if (!nextId) return

    nextTrackIdRef.value = nextId
    const track = playlist.playlist.value.find(t => t.id === nextId)
    if (track) {
      await audioCore.preloadTrack(track)
    }
  }

  async function handleTrackEnded() {
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

    recentPlayedIds.value = [trackId, ...recentPlayedIds.value.filter(id => id !== trackId)].slice(
      0,
      getMaxRecentCount()
    )

    progress.setCurrentTrack(trackId)
    const savedProgress = progress.getProgress(trackId)

    if (audioCore.applyPreloadedTrack(track)) {
      await audioCore.audio.value?.play()
      audioCore.isPlaying.value = true
    } else {
      await audioCore.playTrack(track)
    }

    playlist.updateCurrentTrackId(trackId)
    if (savedProgress > 0 && savedProgress < (audioCore.duration.value || 0) - 5) {
      audioCore.seekTo(savedProgress)
    }

    triggerPreload()
  }

  async function handleNearEnd() {
    await triggerPreload()
  }

  /**
   * 播放下一首曲目
   */
  function playNextTrack() {
    let nextId: string | null = null

    if (playMode.playMode.value === 'random') {
      const list = playlist.playlist.value
      if (list.length === 0) return

      const availableTracks = list.filter(t => !recentPlayedIds.value.includes(t.id))
      const pool = availableTracks.length > 0 ? availableTracks : list
      const randomIndex = Math.floor(Math.random() * pool.length)
      nextId = pool[randomIndex].id
    } else {
      nextId = getNextTrackId()
    }

    if (nextId) playTrack(nextId)
  }

  /**
   * 播放上一首曲目
   */
  function playPreviousTrack() {
    const prevId = getPreviousTrackId()
    if (prevId) playTrack(prevId)
  }

  /**
   * 设置音量
   * 同时更新持久化存储和音频核心
   * @param vol 音量值（0-1）
   */
  function setVolume(vol: number) {
    volume.setVolume(vol)
    audioCore.setVolume(vol)
  }

  /**
   * 选择文件夹并加载音频文件
   * 打开系统对话框，选择后扫描并添加到播放列表
   */
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

  function showTrackInfo(track: AudioFile) {
    return {
      name: track.name,
      path: track.path,
      title: track.title || '未知',
      artist: track.artist || '未知艺术家',
      album: track.album || '未知专辑',
      duration: audioCore.formatTime(track.duration || 0)
    }
  }

  function setSortOption(option: SortOption) {
    playlist.setSortOption(option)
  }

  function seek(time: number) {
    audioCore.seekTo(time)
  }

  function saveProgress(time: number) {
    const trackId = playlist.currentTrackId.value
    if (trackId && time > 0) {
      progress.saveProgress(trackId, time)
    }
  }

  audioCore.onTrackEnded(handleTrackEnded)
  audioCore.onNearEnd(handleNearEnd)

  function checkAndPreload() {
    const duration = audioCore.duration.value
    const currentTime = audioCore.currentTime.value
    if (duration && currentTime && duration - currentTime <= 10) {
      triggerPreload()
    }
  }

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
    saveProgress,
    showTrackInfo,
    checkAndPreload,
    seek
  }
}

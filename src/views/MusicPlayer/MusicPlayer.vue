<script lang="ts" setup>
import { onActivated, onDeactivated, provide } from 'vue'
import { useAudioCore } from './hooks/useAudioCore'
import { usePlaylist } from './hooks/usePlaylist'
import { usePlayMode } from './hooks/usePlayMode'
import { useFileLoader } from './hooks/useFileLoader'
import { usePlaybackProgress } from './hooks/usePlaybackProgress'
import { usePlayerCoordinator } from './hooks/usePlayerCoordinator'
import { useDragDrop } from './hooks/useDragDrop'
import { useTopActions } from './hooks/useTopActions'
import PlayerPanel from './components/PlayerPanel.vue'
import PlaylistPanel from './components/PlaylistPanel.vue'
import { MusicPlayerContextKey, type PlayerContext } from './contexts/PlayerContext'
import { eventBus } from './utils/eventBus'
import { useEmitter } from '../../utils/event'

const audioCoreObj = useAudioCore()
const playlistObj = usePlaylist()
const playModeObj = usePlayMode()

const { isPlaying, isLoading, currentTime, duration, togglePlay, volume, setVolume, stop } =
  audioCoreObj

const { currentTrack, currentTrackId, setSearchQuery } = playlistObj

const { togglePlayMode } = playModeObj

const progressObj = usePlaybackProgress()

const { selectFolder, loadFilesFromFolder } = useFileLoader()

function removeTrack(trackId: string) {
  // 如果删除的是当前正在播放的曲目，则停止播放
  if (trackId === currentTrackId.value) {
    stop()
  }
  const index = playlistObj.playlist.value.findIndex(track => track.id === trackId)
  if (index !== -1) {
    playlistObj.removeFromPlaylist(index)
  }
}

function removeTracks(trackIds: string[]) {
  // 如果删除的列表包含当前正在播放的曲目，则停止播放
  if (trackIds.includes(currentTrackId.value || '')) {
    stop()
  }
  // 批量删除：从后往前删除，避免索引变化问题
  const sortedIds = [...trackIds].sort((a, b) => {
    const indexA = playlistObj.playlist.value.findIndex(track => track.id === a)
    const indexB = playlistObj.playlist.value.findIndex(track => track.id === b)
    return indexB - indexA
  })
  sortedIds.forEach(trackId => {
    const index = playlistObj.playlist.value.findIndex(track => track.id === trackId)
    if (index !== -1) {
      playlistObj.removeFromPlaylist(index)
    }
  })
}

function clearPlaylist() {
  // 清空列表时停止播放
  stop()
  playlistObj.clearPlaylist()
}

const coordinator = usePlayerCoordinator({
  playlist: playlistObj,
  audioCore: audioCoreObj,
  playMode: playModeObj,
  fileLoader: { selectFolder, loadFilesFromFolder },
  progress: progressObj,
  isPlaying,
  currentTrack
})

const dragDrop = useDragDrop({ coordinator })

const topActions = useTopActions({
  playMode: playModeObj,
  audioCore: audioCoreObj,
  playlist: playlistObj,
  coordinator
})

const isDragging = dragDrop.isDragging

const playerContext: PlayerContext = {
  isPlaying,
  isLoading,
  currentTime,
  duration,
  volume,
  currentTrack,
  togglePlay,
  setVolume,
  playTrack: coordinator.playTrack,
  playNextTrack: coordinator.playNextTrack,
  playPreviousTrack: coordinator.playPreviousTrack,
  handleProgressChange: topActions.handleProgressChange,
  togglePlayMode,
  selectFolder: coordinator.selectFolder,
  removeTrack,
  removeTracks,
  clearPlaylist,
  stop
}

provide(MusicPlayerContextKey, playerContext)

useEmitter(
  'toggle-play',
  () => {
    if (currentTrack.value) {
      togglePlay()
    }
  },
  { instance: eventBus }
)

useEmitter('play-track', coordinator.playTrack, { instance: eventBus })

useEmitter('play-next', coordinator.playNextTrack, { instance: eventBus })

useEmitter('play-previous', coordinator.playPreviousTrack, { instance: eventBus })

useEmitter('seek', coordinator.seek, { instance: eventBus })

useEmitter('set-volume', setVolume, { instance: eventBus })

useEmitter('toggle-play-mode', togglePlayMode, { instance: eventBus })

useEmitter('select-folder', coordinator.selectFolder, { instance: eventBus })

useEmitter('clear-search', () => setSearchQuery(''), { instance: eventBus })

function handleKeydown(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    if (currentTrack.value) {
      togglePlay()
    }
  }
}

onActivated(() => {
  window.addEventListener('keydown', handleKeydown)
  // 同步音量，确保 Audio 元素的音量与持久化存储中的值一致
  setVolume(volume.value * 100)
})

onDeactivated(() => {
  window.removeEventListener('keydown', handleKeydown)
})

watchThrottled(
  currentTime,
  time => {
    coordinator.saveProgress(time)
    coordinator.checkAndPreload()
  },
  { throttle: 1000 }
)

function handleDragDrop(event: DragEvent) {
  dragDrop.handleDrop(event)
}

function handleDragOver(event: DragEvent) {
  dragDrop.handleDragOver(event)
}

function handleDragLeave(event: DragEvent) {
  dragDrop.handleDragLeave(event)
}
</script>

<template>
  <div class="flex flex-col md:flex-row">
    <PlayerPanel
      :class="{ 'bg-[--hoverColor]': isDragging }"
      @drop="handleDragDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave" />

    <PlaylistPanel
      :class="{ 'bg-[--hoverColor]': isDragging }"
      @drop="handleDragDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave" />
  </div>
</template>

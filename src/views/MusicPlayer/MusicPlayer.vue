<script lang="ts" setup>
import type { SortOption } from './hooks/usePlaylist'
import { watch, onMounted, onActivated, onDeactivated, reactive } from 'vue'
import { useAudioCore } from './hooks/useAudioCore'
import { usePlaylist } from './hooks/usePlaylist'
import { usePlayMode } from './hooks/usePlayMode'
import { useVolume } from './hooks/useVolume'
import { useFileLoader } from './hooks/useFileLoader'
import { usePlaybackProgress } from './hooks/usePlaybackProgress'
import { usePlayerCoordinator } from './hooks/usePlayerCoordinator'
import { useDragDrop } from './hooks/useDragDrop'
import { useContextMenu } from './hooks/useContextMenu'
import { useTopActions } from './hooks/useTopActions'
import PlayerPanel from './components/PlayerPanel.vue'
import PlaylistPanel from './components/PlaylistPanel.vue'

const audioCoreObj = useAudioCore()
const playlistObj = usePlaylist()
const playModeObj = usePlayMode()
const volumeObj = useVolume()

const {
  isPlaying,
  isLoading,
  currentTime,
  duration,
  formatTime,
  togglePlay,
  setVolume: setAudioVolume
} = audioCoreObj

const {
  currentTrack,
  currentTrackId,
  searchQuery,
  sortOption,
  sortOrder,
  filteredPlaylist,
  setSearchQuery,
  setSortOption
} = playlistObj

function handleSortOptionChange(option: SortOption | undefined) {
  if (option) {
    setSortOption(option)
  }
}

const { togglePlayMode } = playModeObj

const { volume } = volumeObj

const progressObj = usePlaybackProgress()

const { selectFolder, loadFilesFromFolder } = useFileLoader()

const {
  options: contextMenuOptions,
  menuProps: contextMenuMenuProps,
  show: showContextMenu,
  hide: hideContextMenu
} = useContextMenu()

const coordinator = usePlayerCoordinator({
  playlist: playlistObj,
  audioCore: audioCoreObj,
  playMode: playModeObj,
  volume: volumeObj,
  fileLoader: { selectFolder, loadFilesFromFolder },
  progress: progressObj,
  isPlaying,
  currentTrack
})

const dragDrop = useDragDrop({ coordinator })

const topActions = useTopActions({
  playMode: playModeObj,
  volume: volumeObj,
  audioCore: audioCoreObj,
  playlist: playlistObj,
  coordinator
})

const isDragging = dragDrop.isDragging

function handleKeydown(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    if (currentTrack.value) {
      togglePlay()
    }
  }
}

onMounted(() => {
  setAudioVolume(volume.value)
})

watchThrottled(
  currentTime,
  time => {
    coordinator.saveProgress(time)
    coordinator.checkAndPreload()
  },
  { throttle: 1000 }
)

onActivated(() => {
  window.addEventListener('keydown', handleKeydown)
})

onDeactivated(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const infoModalProps = reactive({
  show: false,
  title: '',
  data: null as Record<string, string> | null
})

function handlePlaylistMenuSelect(key: string) {
  const track = contextMenuMenuProps.track
  if (!track) return

  switch (key) {
    case 'play':
      coordinator.playTrack(track.id)
      break
    case 'info': {
      const info = coordinator.showTrackInfo(track)
      infoModalProps.title = info.title
      infoModalProps.data = {
        文件名: info.name,
        路径: info.path,
        标题: info.title,
        艺术家: info.artist,
        专辑: info.album,
        时长: info.duration
      }
      infoModalProps.show = true
      break
    }
    case 'remove':
      coordinator.removeTrack(track.id)
      break
  }
  hideContextMenu()
}

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
  <div class="flex flex-col md:flex-row h-full">
    <PlayerPanel
      :is-playing="isPlaying"
      :is-loading="isLoading"
      :current-track="currentTrack"
      :current-time="currentTime"
      :duration="duration"
      :volume-value="volume"
      :play-mode-icon="topActions.currentPlayModeIcon.value"
      :play-mode-label="topActions.currentPlayModeLabel.value"
      :progress-percent="topActions.progressPercent.value"
      :format-time="formatTime"
      :toggle-play="togglePlay"
      :handle-progress-change="topActions.handleProgressChange"
      :handle-volume-change="topActions.handleVolumeChange"
      :toggle-play-mode="togglePlayMode"
      :play-previous="coordinator.playPreviousTrack"
      :play-next="coordinator.playNextTrack"
      :select-folder="coordinator.selectFolder"
      :class="{ 'bg-[--hoverColor]': isDragging }"
      @drop="handleDragDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave" />

    <PlaylistPanel
      v-model:search-query="searchQuery"
      v-model:context-menu-show="contextMenuMenuProps.show"
      v-model:info-modal-show="infoModalProps.show"
      :sort-option="sortOption"
      :playlist="filteredPlaylist"
      :current-track-id="currentTrackId"
      :sort-order="sortOrder"
      :sort-options="topActions.sortOptions"
      :sort-label="topActions.getSortLabel(sortOption)"
      :action-options="topActions.actionOptions.value"
      :context-menu-x="contextMenuMenuProps.x"
      :context-menu-y="contextMenuMenuProps.y"
      :context-menu-options="contextMenuOptions"
      :context-menu-track="contextMenuMenuProps.track"
      :info-modal-title="infoModalProps.title"
      :info-modal-data="infoModalProps.data"
      :class="{ 'bg-[--hoverColor]': isDragging }"
      @drop="handleDragDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @clear-search="setSearchQuery('')"
      @select-action="topActions.handleActionSelect"
      @context-menu-select="handlePlaylistMenuSelect"
      @dbl-click="coordinator.playTrack"
      @context-menu="showContextMenu"
      @update:sort-option="handleSortOptionChange" />
  </div>
</template>

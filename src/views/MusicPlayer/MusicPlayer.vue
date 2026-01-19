<script lang="ts" setup>
import { useAudioCore } from './hooks/useAudioCore'
import { usePlaylist } from './hooks/usePlaylist'
import { usePlayMode } from './hooks/usePlayMode'
import { useFileLoader } from './hooks/useFileLoader'
import { usePlaybackProgress } from './hooks/usePlaybackProgress'
import { usePlayerCoordinator } from './hooks/usePlayerCoordinator'
import { useDragDrop } from './hooks/useDragDrop'
import { useTopActions } from './hooks/useTopActions'
import { usePlaylistIO } from './hooks/usePlaylistIO'
import PlayerPanel from './components/PlayerPanel.vue'
import PlaylistPanel from './components/PlaylistPanel.vue'
import { MusicPlayerContextKey, type PlayerContext } from './contexts/PlayerContext'
import { eventBus } from './utils/eventBus'
import { useEmitter } from '../../utils/event'
import { useMusicPlayerStore, usePlaybackProgressStore } from '@/stores/musicPlayer'
import { Motion, AnimatePresence } from 'motion-v'

const audioCoreObj = useAudioCore()
const playlistObj = usePlaylist()
const playModeObj = usePlayMode()
const playlistIO = usePlaylistIO()
const musicPlayerStore = useMusicPlayerStore()
const playbackProgressStore = usePlaybackProgressStore()

// 全屏状态管理
const isFullScreen = ref(false)

const {
  isPlaying,
  isLoading,
  isPreloading,
  currentTime,
  duration,
  togglePlay,
  volume,
  setVolume,
  stop
} = audioCoreObj
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

// 全屏状态切换
function toggleFullScreen() {
  isFullScreen.value = !isFullScreen.value
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

const { isInitializing } = coordinator

// 组合的loading状态：初始化loading、播放loading或预加载loading
const isAnyLoading = computed(() => isInitializing.value || isLoading.value || isPreloading.value)

const dragDrop = useDragDrop({ coordinator })

const topActions = useTopActions({
  playMode: playModeObj,
  audioCore: audioCoreObj,
  playlist: playlistObj,
  coordinator,
  playlistIO
})

const isDragging = dragDrop.isDragging

const playerContext: PlayerContext = {
  isPlaying,
  isLoading,
  isAnyLoading,
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

useEmitter(eventBus, {
  event: 'toggle-play',
  handler: () => {
    if (currentTrack.value) {
      togglePlay()
    }
  }
})

useEmitter(eventBus, {
  event: 'play-track',
  handler: coordinator.playTrack
})
useEmitter(eventBus, {
  event: 'play-next',
  handler: coordinator.playNextTrack
})
useEmitter(eventBus, {
  event: 'play-previous',
  handler: coordinator.playPreviousTrack
})

useEmitter(eventBus, {
  event: 'seek',
  handler: coordinator.seek
})
useEmitter(eventBus, {
  event: 'set-volume',
  handler: setVolume
})
useEmitter(eventBus, {
  event: 'toggle-play-mode',
  handler: togglePlayMode
})
useEmitter(eventBus, {
  event: 'select-folder',
  handler: coordinator.selectFolder
})
useEmitter(eventBus, {
  event: 'clear-search',
  handler: () => setSearchQuery('')
})

function handleKeydown(e: KeyboardEvent) {
  // 检查是否在输入框或文本区域中，如果是则不处理快捷键
  const activeElement = document.activeElement
  const isInputElement =
    activeElement instanceof HTMLElement &&
    (['INPUT', 'TEXTAREA'].includes(activeElement.tagName) ||
      activeElement.contentEditable === 'true')
  // 如果在输入框中，不处理空格键快捷键
  if (e.code === 'Space' && !isInputElement) {
    e.preventDefault()
    if (currentTrack.value) {
      togglePlay()
    }
  }
}

onMounted(async () => {
  // 等待 store 准备就绪后再初始化播放进度
  await Promise.all([
    musicPlayerStore.$ready?.waitForReady?.(),
    playbackProgressStore.$ready?.waitForReady?.()
  ])

  // 确保默认播放列表已初始化（处理数据迁移）
  musicPlayerStore.initializeDefaultPlaylist()

  // 初始化播放进度，预加载上次播放的音乐音轨
  await coordinator.initializeProgress()
})

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

// 监听播放状态变化，更新进度存储
watch(isPlaying, playing => {
  if (!playing && currentTime.value > 0) {
    progressObj.pauseProgress()
  }
})

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
  <div class="flex flex-col">
    <!-- 主要内容区域 -->
    <div class="flex-1 overflow-hidden" v-if="!isFullScreen">
      <PlaylistPanel
        :class="{ 'bg-[--hoverColor]': isDragging }"
        @drop="handleDragDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave" />
    </div>

    <!-- 播放器面板（使用单个实例，根据全屏状态动态调整样式和动画） -->
    <AnimatePresence mode="wait">
      <!-- 主容器，用于处理拖拽事件和背景色 -->
      <Motion
        :key="isFullScreen ? 'fullscreen' : 'normal'"
        :class="{
          'bg-[--hoverColor]': isDragging,
          'fixed bottom-0 left-0 w-full h-[calc(100vh-85px)] z-[1000] border-none': isFullScreen
        }"
        :initial="isFullScreen ? { y: '100%' } : {}"
        :animate="{ y: 0 }"
        :exit="isFullScreen ? { y: '100%' } : {}"
        :transition="{ duration: 0.3, ease: 'easeOut' }"
        @drop="handleDragDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave">
        <PlayerPanel :is-full-screen="isFullScreen" @toggle-full-screen="toggleFullScreen" />
      </Motion>
    </AnimatePresence>
  </div>
</template>

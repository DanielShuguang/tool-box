<script lang="ts" setup>
import {
  PlayOutline,
  PauseOutline,
  PlaySkipBackOutline,
  PlaySkipForwardOutline,
  VolumeHighOutline,
  VolumeMuteOutline,
  FolderOutline,
  ArrowUpOutline,
  ArrowDownOutline,
  SearchOutline
} from '@vicons/ionicons5'
import { Motion, AnimatePresence } from 'motion-v'
import { NIcon, NModal, NDescriptions, NDescriptionsItem } from 'naive-ui'
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
import type { SortOption } from './hooks/usePlaylist'

const audioCore = useAudioCore()
const playlist = usePlaylist()
const playMode = usePlayMode()
const volume = useVolume()
const fileLoader = useFileLoader()
const progress = usePlaybackProgress()

const isPlaying = audioCore.isPlaying
const isLoading = audioCore.isLoading
const currentTime = audioCore.currentTime
const duration = audioCore.duration
const currentTrack = playlist.currentTrack
const searchQuery = playlist.searchQuery
const sortOption = playlist.sortOption
const sortOrder = playlist.sortOrder
const filteredPlaylist = playlist.filteredPlaylist

const coordinator = usePlayerCoordinator({
  playlist,
  audioCore,
  playMode,
  volume,
  fileLoader,
  progress,
  isPlaying,
  currentTrack
})

const dragDrop = useDragDrop({ coordinator })

const contextMenu = useContextMenu()

const topActions = useTopActions({
  playMode,
  volume,
  audioCore,
  playlist,
  coordinator
})

const isDragging = dragDrop.isDragging

const { containerProps, list, wrapperProps } = useVirtualList(filteredPlaylist, {
  itemHeight: 58,
  overscan: 10
})

function handleKeydown(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    if (currentTrack.value) {
      audioCore.togglePlay()
    }
  }
}

onMounted(() => {
  audioCore.setVolume(volume.volume.value)
})

watch(currentTime, time => {
  coordinator.saveProgress(time)
})

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
  const track = contextMenu.menuProps.track
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
  contextMenu.hide()
}
</script>

<template>
  <div class="flex flex-col md:flex-row h-full">
    <div
      class="w-full md:w-[400px] flex flex-col items-center justify-center p-[15px] border-(1px solid) border-[--borderColor] overflow-hidden relative flex-shrink-0"
      :class="{ 'bg-[--hoverColor]': isDragging }"
      @drop="dragDrop.handleDrop"
      @dragover="dragDrop.handleDragOver"
      @dragleave="dragDrop.handleDragLeave">
      <div v-if="!currentTrack" class="text-center text-[--textColor3]">
        <div
          class="mb-[20px] p-[25px] md:p-[30px] rounded-full bg-gradient-to-br from-[--hoverColor] to-[--borderColor] inline-block shadow-md">
          <n-icon size="60" :depth="3">
            <FolderOutline />
          </n-icon>
        </div>
        <p class="text-[13px] md:text-[16px] mb-[8px] font-medium">拖拽音频文件到此处</p>
        <p class="text-[13px] mb-[15px] text-[--textColor3]">
          支持 MP3、WAV、FLAC、M4A、OGG、AAC 格式
        </p>
        <n-button
          type="primary"
          size="medium"
          @click="coordinator.selectFolder()"
          class="shadow-lg">
          <template #icon>
            <n-icon>
              <FolderOutline />
            </n-icon>
          </template>
          选择文件夹
        </n-button>
      </div>

      <div v-else class="w-full max-w-[360px]">
        <div class="flex flex-col items-center mb-[20px]">
          <div
            class="w-[120px] sm:w-[140px] md:w-[160px] h-[120px] sm:h-[140px] md:h-[160px] mb-[15px] rounded-2xl bg-gradient-to-br from-[--primaryColor] to-[--primaryColorHover] flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105">
            <n-icon size="64" :depth="3" class="text-white">
              <PlayOutline v-if="!isPlaying" />
              <PauseOutline v-else />
            </n-icon>
          </div>
          <h2
            class="text-[16px] sm:text-[18px] md:text-[20px] font-bold mb-[8px] text-center text-[--textColor1] overflow-hidden whitespace-nowrap w-full">
            <AnimatePresence>
              <Motion
                v-if="(currentTrack.title || currentTrack.name).length > 15"
                tag="span"
                class="inline-block"
                :animate="{ x: '-50%' }"
                :transition="{ duration: 20, repeat: Infinity, ease: 'linear' }">
                {{ currentTrack.title || currentTrack.name }}
                　　{{ currentTrack.title || currentTrack.name }}
              </Motion>
              <span v-else>
                {{ currentTrack.title || currentTrack.name }}
              </span>
            </AnimatePresence>
          </h2>
          <p class="text-[--textColor3] text-[14px] mb-[3px] line-clamp-1">
            {{ currentTrack.artist || '未知艺术家' }}
          </p>
          <p v-if="currentTrack.album" class="text-[--textColor3] text-[12px] line-clamp-1">
            {{ currentTrack.album }}
          </p>
        </div>

        <div class="mb-[20px] px-[8px] relative">
          <n-slider
            :value="topActions.progressPercent.value"
            :format-tooltip="() => audioCore.formatTime(currentTime)"
            color="--primaryColor"
            @update:value="topActions.handleProgressChange"
            :disabled="isLoading" />
          <div class="flex justify-between text-[11px] text-[--textColor3] mt-[4px]">
            <span>{{ audioCore.formatTime(currentTime) }}</span>
            <span>{{ audioCore.formatTime(duration) }}</span>
          </div>
          <div
            v-if="isLoading"
            class="absolute inset-0 bg-[--bgColor]/30 flex items-center justify-center rounded-lg">
            <n-spin size="small" :radius="12" />
          </div>
        </div>

        <div class="flex justify-center items-center gap-[20px] mb-[18px]">
          <n-button
            circle
            size="medium"
            quaternary
            @click="coordinator.playPreviousTrack()"
            class="transition-transform hover:scale-110">
            <template #icon>
              <n-icon size="24">
                <PlaySkipBackOutline />
              </n-icon>
            </template>
          </n-button>

          <n-button
            circle
            size="medium"
            type="primary"
            @click="audioCore.togglePlay()"
            class="w-[52px] h-[52px] shadow-lg transition-transform hover:scale-110">
            <template #icon>
              <n-icon size="32">
                <PauseOutline v-if="isPlaying" />
                <PlayOutline v-else />
              </n-icon>
            </template>
          </n-button>

          <n-button
            circle
            size="medium"
            quaternary
            @click="coordinator.playNextTrack()"
            class="transition-transform hover:scale-110">
            <template #icon>
              <n-icon size="24">
                <PlaySkipForwardOutline />
              </n-icon>
            </template>
          </n-button>
        </div>

        <div class="flex items-center gap-[8px] mb-[15px] px-[15px]">
          <n-icon size="18" class="text-[--textColor3]">
            <VolumeHighOutline v-if="volume.volume.value > 0" />
            <VolumeMuteOutline v-else />
          </n-icon>
          <n-slider
            :value="volume.volume.value * 100"
            class="flex-1"
            color="--primaryColor"
            @update:value="topActions.handleVolumeChange" />
        </div>

        <div class="flex justify-center gap-[8px]">
          <n-button
            quaternary
            @click="playMode.togglePlayMode"
            size="small"
            class="transition-colors">
            <template #icon>
              <n-icon size="16">
                <component :is="topActions.currentPlayModeIcon.value" />
              </n-icon>
            </template>
            {{ topActions.currentPlayModeLabel.value }}
          </n-button>
        </div>
      </div>
    </div>

    <div
      class="flex-1 border-(1px solid) border-[--borderColor] flex flex-col min-h-0 relative min-w-0"
      :class="{ 'bg-[--hoverColor]': isDragging }"
      @drop="dragDrop.handleDrop"
      @dragover="dragDrop.handleDragOver"
      @dragleave="dragDrop.handleDragLeave">
      <div
        class="flex items-center justify-between p-[12px] border-b-(1px solid) border-[--borderColor] bg-[--hoverColor] gap-[8px]">
        <div class="flex items-center gap-[8px]">
          <span class="font-bold text-[14px]">
            播放列表 ({{ topActions.displayPlayList.value }})
          </span>
          <n-dropdown
            :options="topActions.sortOptions"
            @select="(key: string) => coordinator.setSortOption(key as SortOption)"
            :trigger="'click'">
            <n-button size="tiny" quaternary class="flex items-center gap-[4px] cursor-pointer">
              {{ topActions.getSortLabel(sortOption) }}
              <n-icon size="12">
                <ArrowDownOutline v-if="sortOrder === 'asc'" />
                <ArrowUpOutline v-else />
              </n-icon>
            </n-button>
          </n-dropdown>
        </div>
        <n-input
          v-model:value="searchQuery"
          :bordered="false"
          placeholder="搜索歌曲..."
          clearable
          size="small"
          class="flex-1!"
          @clear="playlist.setSearchQuery('')">
          <template #prefix>
            <n-icon size="14">
              <SearchOutline />
            </n-icon>
          </template>
        </n-input>
        <n-dropdown
          :options="topActions.actionOptions.value"
          @select="topActions.handleActionSelect"
          :trigger="'click'">
          <n-button size="tiny" quaternary class="cursor-pointer">
            <template #icon>
              <n-icon size="14">
                <FolderOutline />
              </n-icon>
            </template>
            操作
          </n-button>
        </n-dropdown>
      </div>

      <div v-bind="containerProps" class="flex-1 overflow-auto" @click="contextMenu.hide()">
        <div v-bind="wrapperProps">
          <div
            v-for="item in list"
            :key="item.data.id"
            class="flex items-center px-[12px] border-b-(1px solid) border-[--borderColor] hover:bg-[--hoverColor] transition-colors cursor-pointer h-[50px] box-border"
            :class="{ 'bg-[--activeColor]': playlist.currentTrackId.value === item.data.id }"
            @dblclick="coordinator.playTrack(item.data.id)"
            @contextmenu="contextMenu.show($event, item.data)">
            <div class="flex-1 min-w-0 flex flex-col justify-around h-full box-border">
              <p
                class="text-[14px] truncate"
                :class="{
                  'font-medium text-[--primaryColor]':
                    playlist.currentTrackId.value === item.data.id
                }">
                {{ item.data.title || item.data.name }}
              </p>
              <p class="text-[12px] text-[--textColor3] truncate">
                {{ item.data.artist || '未知艺术家' }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <n-dropdown
        :show="contextMenu.menuProps.show"
        :x="contextMenu.menuProps.x"
        :y="contextMenu.menuProps.y"
        :options="contextMenu.options.value"
        @select="handlePlaylistMenuSelect"
        @clickoutside="contextMenu.hide()" />
      <n-modal
        v-model:show="infoModalProps.show"
        preset="card"
        :title="infoModalProps.title"
        style="width: 400px">
        <n-descriptions :column="1" label-placement="left" v-if="infoModalProps.data">
          <n-descriptions-item v-for="(value, key) in infoModalProps.data" :key="key" :label="key">
            {{ value }}
          </n-descriptions-item>
        </n-descriptions>
      </n-modal>
    </div>
  </div>
</template>

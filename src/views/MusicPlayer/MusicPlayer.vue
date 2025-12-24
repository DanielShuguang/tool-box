<script lang="ts" setup>
import {
  PlayOutline,
  PauseOutline,
  PlaySkipBackOutline,
  PlaySkipForwardOutline,
  VolumeHighOutline,
  VolumeMuteOutline,
  RepeatOutline,
  ShuffleOutline,
  FolderOutline,
  TrashOutline,
  ArrowUpOutline,
  ArrowDownOutline,
  SearchOutline
} from '@vicons/ionicons5'
import { Motion, AnimatePresence } from 'motion-v'
import { useAudioPlayer } from './logic'
import type { SortOption } from './usePlaylist'

const {
  isPlaying,
  isLoading,
  currentTime,
  duration,
  volume,
  playMode,
  playlist,
  filteredPlaylist,
  currentTrack,
  isDragging,
  sortOption,
  sortOrder,
  searchQuery,
  playTrack,
  togglePlay,
  playNextTrack,
  playPreviousTrack,
  seekTo,
  setVolume,
  togglePlayMode,
  selectFolder,
  handleFileDrop,
  removeTrack,
  clearPlaylist,
  setSortOption,
  formatTime
} = useAudioPlayer()

const playModeIcons = {
  sequence: RepeatOutline,
  loop: RepeatOutline,
  single: RepeatOutline,
  random: ShuffleOutline
}

const playModeLabels = {
  sequence: '顺序播放',
  loop: '列表循环',
  single: '单曲循环',
  random: '随机播放'
}

const currentPlayModeIcon = computed(() => playModeIcons[playMode.value])
const currentPlayModeLabel = computed(() => playModeLabels[playMode.value])

const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false

  const files = Array.from(e.dataTransfer?.files || [])
  handleFileDrop(files)
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
}

function handleProgressChange(value: number) {
  const time = (value / 100) * duration.value
  seekTo(time)
}

function handleVolumeChange(value: number) {
  setVolume(value / 100)
}

const sortOptions: Array<{ label: string; key: SortOption }> = [
  { label: '默认排序', key: 'default' },
  { label: '按歌名', key: 'title' },
  { label: '按歌手', key: 'artist' },
  { label: '按专辑', key: 'album' },
  { label: '按文件名', key: 'name' }
]

const sortLabels: Record<SortOption, string> = {
  default: '默认',
  title: '歌名',
  artist: '歌手',
  album: '专辑',
  name: '文件名'
}

function getSortLabel(option: SortOption) {
  return sortLabels[option] || '默认'
}

function handleSortSelect(key: string) {
  setSortOption(key as SortOption)
}

const { containerProps, list, wrapperProps } = useVirtualList(filteredPlaylist, {
  itemHeight: 54,
  overscan: 10
})

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
})

onDeactivated(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="flex flex-col md:flex-row h-full">
    <div
      class="w-full md:w-[400px] flex flex-col items-center justify-center p-[15px] border-(1px solid) border-[--borderColor] overflow-hidden relative flex-shrink-0"
      :class="{ 'bg-[--hoverColor]': isDragging }" @drop="handleDrop" @dragover="handleDragOver"
      @dragleave="handleDragLeave">
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
        <n-button type="primary" size="medium" @click="selectFolder" class="shadow-lg">
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
              <Motion v-if="(currentTrack.title || currentTrack.name).length > 15" tag="span" class="inline-block"
                :animate="{ x: '-50%' }" :transition="{ duration: 20, repeat: Infinity, ease: 'linear' }">
                {{ currentTrack.title || currentTrack.name







                }}　　{{ currentTrack.title || currentTrack.name }}
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
          <n-slider :value="progress" :format-tooltip="() => formatTime(currentTime)" color="--primaryColor"
            @update:value="handleProgressChange" :disabled="isLoading" />
          <div class="flex justify-between text-[11px] text-[--textColor3] mt-[4px]">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
          <div v-if="isLoading" class="absolute inset-0 bg-[--bgColor]/30 flex items-center justify-center rounded-lg">
            <n-spin size="small" :radius="12" />
          </div>
        </div>

        <div class="flex justify-center items-center gap-[20px] mb-[18px]">
          <n-button circle size="medium" quaternary @click="playPreviousTrack"
            class="transition-transform hover:scale-110">
            <template #icon>
              <n-icon size="24">
                <PlaySkipBackOutline />
              </n-icon>
            </template>
          </n-button>

          <n-button circle size="medium" type="primary" @click="togglePlay"
            class="w-[52px] h-[52px] shadow-lg transition-transform hover:scale-110">
            <template #icon>
              <n-icon size="32">
                <PauseOutline v-if="isPlaying" />
                <PlayOutline v-else />
              </n-icon>
            </template>
          </n-button>

          <n-button circle size="medium" quaternary @click="playNextTrack" class="transition-transform hover:scale-110">
            <template #icon>
              <n-icon size="24">
                <PlaySkipForwardOutline />
              </n-icon>
            </template>
          </n-button>
        </div>

        <div class="flex items-center gap-[8px] mb-[15px] px-[15px]">
          <n-icon size="18" class="text-[--textColor3]">
            <VolumeHighOutline v-if="volume > 0" />
            <VolumeMuteOutline v-else />
          </n-icon>
          <n-slider :value="volume * 100" class="flex-1" color="--primaryColor" @update:value="handleVolumeChange" />
        </div>

        <div class="flex justify-center gap-[8px]">
          <n-button quaternary @click="togglePlayMode" size="small" class="transition-colors">
            <template #icon>
              <n-icon size="16">
                <component :is="currentPlayModeIcon" />
              </n-icon>
            </template>
            {{ currentPlayModeLabel }}
          </n-button>
        </div>
      </div>
    </div>

    <div class="flex-1 border-(1px solid) border-[--borderColor] flex flex-col min-h-0 relative min-w-0"
      :class="{ 'bg-[--hoverColor]': isDragging }" @drop="handleDrop" @dragover="handleDragOver"
      @dragleave="handleDragLeave">
      <div
        class="flex items-center justify-between p-[12px] border-b-(1px solid) border-[--borderColor] bg-[--hoverColor]">
        <div class="flex items-center gap-[8px]">
          <span class="font-bold text-[14px]">播放列表 ({{ searchQuery ? `${filteredPlaylist.length}/${playlist.length}` :
            playlist.length }})</span>
          <n-dropdown :options="sortOptions" @select="handleSortSelect" :trigger="'click'">
            <n-button size="tiny" quaternary class="flex items-center gap-[4px] cursor-pointer">
              {{ getSortLabel(sortOption) }}
              <n-icon size="12">
                <ArrowDownOutline v-if="sortOrder === 'asc'" />
                <ArrowUpOutline v-else />
              </n-icon>
            </n-button>
          </n-dropdown>
        </div>
        <div class="flex gap-[8px] items-center">
          <div class="relative">
            <n-input v-model:value="searchQuery" size="small" placeholder="搜索歌名、歌手、文件名" clearable class="w-[180px]">
              <template #prefix>
                <n-icon size="14" class="text-[--textColor3]">
                  <SearchOutline />
                </n-icon>
              </template>
            </n-input>
          </div>
          <n-button size="small" quaternary @click="selectFolder">
            <template #icon>
              <n-icon>
                <FolderOutline />
              </n-icon>
            </template>
            添加文件夹
          </n-button>
          <n-button size="small" quaternary type="error" @click="clearPlaylist" :disabled="playlist.length === 0">
            <template #icon>
              <n-icon>
                <TrashOutline />
              </n-icon>
            </template>
            清空
          </n-button>
        </div>
      </div>

      <div class="position-relative flex-1 min-h-0 overflow-hidden">
        <div v-if="playlist.length" class="size-full" :="containerProps">
          <div :="wrapperProps">
            <div v-for="item in list" :key="item.data.id"
              class="flex items-center justify-between px-[12px] hover:bg-[--hoverColor] cursor-pointer transition-all duration-200"
              :class="{ 'bg-[--hoverColor]': item.data.id === currentTrack?.id }" :style="{ height: '54px' }"
              @dblclick="item.data.id === currentTrack?.id && isPlaying ? undefined : playTrack(item.data.id)">
              <div class="flex items-center gap-[10px] flex-1 min-w-0">
                <div v-if="item.data.id === currentTrack?.id && isPlaying"
                  class="w-[20px] h-[20px] flex items-center justify-center">
                  <div class="flex items-end gap-[2px] h-[12px]">
                    <div class="w-[2px] bg-[--primaryColor] animate-pulse h-[40%]"></div>
                    <div class="w-[2px] bg-[--primaryColor] animate-pulse h-[80%] animate-delay-[0.1s]"></div>
                    <div class="w-[2px] bg-[--primaryColor] animate-pulse h-[60%] animate-delay-[0.2s]"></div>
                  </div>
                </div>
                <div v-else class="w-[20px] text-center text-[12px] text-[--textColor3]">
                  {{ item.index + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="truncate text-[14px]"
                    :class="{ 'text-[--primaryColor] font-medium': item.data.id === currentTrack?.id }">
                    {{ item.data.title || item.data.name }}
                  </div>
                  <div v-if="item.data.artist" class="truncate text-[12px] text-[--textColor3]">
                    {{ item.data.artist }}
                  </div>
                </div>
              </div>
              <n-button size="tiny" quaternary type="error" @click.stop="removeTrack(item.data.id)" class="ml-[8px]">
                <template #icon>
                  <n-icon>
                    <TrashOutline />
                  </n-icon>
                </template>
              </n-button>
            </div>
          </div>
        </div>

        <div v-else class="h-full flex items-center justify-center text-[--textColor3]">
          <div class="text-center">
            <n-icon size="48" :depth="3" class="mb-[10px]">
              <FolderOutline />
            </n-icon>
            <p>暂无歌曲，请添加音频文件</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
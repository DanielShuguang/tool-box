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
import { NIcon } from 'naive-ui'
import { useAudioCore } from './hooks/useAudioCore'
import { usePlaylist } from './hooks/usePlaylist'
import { usePlayMode } from './hooks/usePlayMode'
import { useVolume } from './hooks/useVolume'
import { useFileLoader } from './hooks/useFileLoader'
import { useAudioDrop } from './hooks/useAudioDrop'
import { usePlaybackProgress } from './hooks/usePlaybackProgress'
import type { SortOption } from './hooks/usePlaylist'

const audioCore = useAudioCore()
const playlist = usePlaylist()
const playMode = usePlayMode()
const volume = useVolume()
const fileLoader = useFileLoader()
const audioDrop = useAudioDrop()
const progress = usePlaybackProgress()

const isPlaying = audioCore.isPlaying
const isLoading = audioCore.isLoading
const currentTime = audioCore.currentTime
const duration = audioCore.duration
const currentTrack = playlist.currentTrack
const isDragging = audioDrop.isDragging
const searchQuery = playlist.searchQuery
const sortOption = playlist.sortOption
const sortOrder = playlist.sortOrder
const filteredPlaylist = playlist.filteredPlaylist

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

audioCore.onTrackEnded(handleTrackEnded)

async function playTrack(trackId: string) {
  const track = playlist.playlist.value.find(t => t.id === trackId)
  if (!track) return
  progress.setCurrentTrack(trackId)
  const savedProgress = progress.getProgress(trackId)
  await audioCore.playTrack(track)
  playlist.updateCurrentTrackId(trackId)
  if (savedProgress > 0 && savedProgress < (duration.value || 0) - 5) {
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

onMounted(() => {
  audioCore.setVolume(volume.volume.value)
})

watch(currentTime, time => {
  const trackId = playlist.currentTrackId.value
  if (trackId && time > 0) {
    progress.saveProgress(trackId, time)
  }
})

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

const currentPlayModeIcon = computed(() => playModeIcons[playMode.playMode.value])
const currentPlayModeLabel = computed(() => playModeLabels[playMode.playMode.value])

const progressPercent = computed(() => {
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
  audioCore.seekTo(time)
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

const actionOptions = [
  { label: '添加文件夹', key: 'addFolder', icon: () => h(NIcon, { size: 14 }, { default: () => h(FolderOutline) }) },
  { type: 'divider', key: 'd1' },
  { label: '清空播放列表', key: 'clear', icon: () => h(NIcon, { size: 14 }, { default: () => h(TrashOutline) }) }
]

function handleActionSelect(key: string) {
  if (key === 'addFolder') {
    selectFolder()
  } else if (key === 'clear') {
    clearPlaylist()
  }
}

const { containerProps, list, wrapperProps } = useVirtualList(filteredPlaylist, {
  itemHeight: 54,
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
          <n-slider :value="progressPercent" :format-tooltip="() => audioCore.formatTime(currentTime)"
            color="--primaryColor" @update:value="handleProgressChange" :disabled="isLoading" />
          <div class="flex justify-between text-[11px] text-[--textColor3] mt-[4px]">
            <span>{{ audioCore.formatTime(currentTime) }}</span>
            <span>{{ audioCore.formatTime(duration) }}</span>
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

          <n-button circle size="medium" type="primary" @click="audioCore.togglePlay()"
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
            <VolumeHighOutline v-if="volume.volume.value > 0" />
            <VolumeMuteOutline v-else />
          </n-icon>
          <n-slider :value="volume.volume.value * 100" class="flex-1" color="--primaryColor"
            @update:value="handleVolumeChange" />
        </div>

        <div class="flex justify-center gap-[8px]">
          <n-button quaternary @click="playMode.togglePlayMode" size="small" class="transition-colors">
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
        class="flex items-center justify-between p-[12px] border-b-(1px solid) border-[--borderColor] bg-[--hoverColor] gap-[8px]">
        <div class="flex items-center gap-[8px]">
          <span class="font-bold text-[14px]">播放列表 ({{ searchQuery ?
            `${filteredPlaylist.length}/${playlist.playlist.value.length}` :
            playlist.playlist.value.length }})</span>
          <n-dropdown :options="sortOptions" @select="(key: string) => setSortOption(key as SortOption)"
            :trigger="'click'">
            <n-button size="tiny" quaternary class="flex items-center gap-[4px] cursor-pointer">
              {{ getSortLabel(sortOption) }}
              <n-icon size="12">
                <ArrowDownOutline v-if="sortOrder === 'asc'" />
                <ArrowUpOutline v-else />
              </n-icon>
            </n-button>
          </n-dropdown>
        </div>
        <n-input v-model:value="searchQuery" :bordered="false" placeholder="搜索歌曲..." clearable size="small"
          class="flex-1!" @clear="playlist.setSearchQuery('')">
          <template #prefix>
            <n-icon size="14">
              <SearchOutline />
            </n-icon>
          </template>
        </n-input>
        <n-dropdown :options="actionOptions" @select="handleActionSelect" :trigger="'click'">
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

      <div v-bind="containerProps" class="flex-1 overflow-auto">
        <div v-bind="wrapperProps">
          <div v-for="item in list" :key="item.data.id" class="flex items-center px-[12px] border-b-(1px solid)
            border-[--borderColor] hover:bg-[--hoverColor] transition-colors cursor-pointer"
            :class="{ 'bg-[--activeColor]': playlist.currentTrackId.value === item.data.id }"
            @dblclick="playTrack(item.data.id)">
            <div class="flex-1 min-w-0 py-[8px] pr-[8px]">
              <p class="text-[14px] truncate"
                :class="{ 'font-medium text-[--primaryColor]': playlist.currentTrackId.value === item.data.id }">
                {{ item.data.title || item.data.name }}
              </p>
              <p class="text-[12px] text-[--textColor3] truncate">
                {{ item.data.artist || '未知艺术家' }}
              </p>
            </div>
            <div class="flex items-center gap-[8px]">
              <n-button size="tiny" quaternary circle @click.stop="removeTrack(item.data.id)">
                <template #icon>
                  <n-icon size="14">
                    <TrashOutline />
                  </n-icon>
                </template>
              </n-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

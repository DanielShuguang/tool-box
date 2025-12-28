<script setup lang="ts">
import { Motion, AnimatePresence } from 'motion-v'
import {
  PlayOutline,
  PauseOutline,
  PlaySkipBackOutline,
  PlaySkipForwardOutline,
  VolumeHighOutline,
  VolumeMuteOutline,
  FolderOutline,
  RepeatOutline,
  ShuffleOutline
} from '@vicons/ionicons5'
import { useMusicPlayerContext } from '../contexts/PlayerContext'
import { useMusicPlayerStore } from '@/stores/musicPlayer'
import { eventBus } from '../utils/eventBus'
import { formatTime, getTrackTitle, getTrackArtist } from '../utils/musicUtils'

const emit = defineEmits<{
  drop: [event: DragEvent]
  dragover: [event: DragEvent]
  dragleave: [event: DragEvent]
}>()

const context = useMusicPlayerContext()
const store = useMusicPlayerStore()

const {
  isPlaying,
  isAnyLoading,
  currentTime,
  duration,
  togglePlayMode,
  handleProgressChange,
  selectFolder
} = context

const { currentTrack, volume, playMode } = storeToRefs(store)

// 播放模式标签映射
const playModeLabels: Record<string, string> = {
  sequence: '顺序播放',
  loop: '列表循环',
  single: '单曲循环',
  random: '随机播放'
}

// 播放模式图标映射
const playModeIcons: Record<string, any> = {
  sequence: RepeatOutline,
  loop: RepeatOutline,
  single: RepeatOutline,
  random: ShuffleOutline
}

const playModeLabel = computed(() => {
  if (currentTrack.value) {
    return playModeLabels[playMode.value]
  }
  return ''
})

const currentPlayModeIcon = computed(() => playModeIcons[playMode.value])

function handleTogglePlay() {
  eventBus.emit('toggle-play')
}

function handleVolumeChange(value: number) {
  eventBus.emit('set-volume', value)
}

function handlePlayPrevious() {
  eventBus.emit('play-previous')
}

function handlePlayNext() {
  eventBus.emit('play-next')
}
</script>

<template>
  <div
    class="w-full md:w-[400px] flex flex-col items-center justify-center p-[15px] border-(1px solid) border-[--borderColor] overflow-hidden relative flex-shrink-0"
    @drop="emit('drop', $event)"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave', $event)">
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
            <Motion
              v-if="getTrackTitle(currentTrack).length > 15"
              tag="span"
              class="inline-block"
              :animate="{ x: '-50%' }"
              :transition="{ duration: 20, repeat: Infinity, ease: 'linear' }">
              {{ getTrackTitle(currentTrack) }}
              　　{{ getTrackTitle(currentTrack) }}
            </Motion>
            <span v-else>
              {{ getTrackTitle(currentTrack) }}
            </span>
          </AnimatePresence>
        </h2>
        <p class="text-[--textColor3] text-[14px] mb-[3px] line-clamp-1">
          {{ getTrackArtist(currentTrack) }}
        </p>
        <p v-if="currentTrack.album" class="text-[--textColor3] text-[12px] line-clamp-1">
          {{ currentTrack.album }}
        </p>
      </div>

      <div class="mb-[20px] px-[8px] relative">
        <n-slider
          :value="duration > 0 ? (currentTime / duration) * 100 : 0"
          :format-tooltip="() => formatTime(currentTime)"
          color="--primaryColor"
          @update:value="handleProgressChange"
          :disabled="isAnyLoading" />
        <div class="flex justify-between text-[11px] text-[--textColor3] mt-[4px]">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
        <div
          v-if="isAnyLoading"
          class="absolute inset-0 bg-[--bgColor]/30 flex items-center justify-center rounded-lg">
          <n-spin size="small" :radius="12" />
        </div>
      </div>

      <div class="flex justify-center items-center gap-[20px] mb-[18px]">
        <n-button
          circle
          size="medium"
          quaternary
          @click="handlePlayPrevious"
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
          @click="handleTogglePlay"
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
          @click="handlePlayNext"
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
          <VolumeHighOutline v-if="volume > 0" />
          <VolumeMuteOutline v-else />
        </n-icon>
        <n-slider
          :value="Math.round(volume * 100)"
          class="flex-1"
          color="--primaryColor"
          @update:value="handleVolumeChange" />
      </div>

      <div class="flex justify-center gap-[8px]">
        <n-button quaternary @click="togglePlayMode" size="small" class="transition-colors">
          <template #icon>
            <n-icon size="16">
              <component :is="currentPlayModeIcon" />
            </n-icon>
          </template>
          {{ playModeLabel }}
        </n-button>
      </div>
    </div>
  </div>
</template>

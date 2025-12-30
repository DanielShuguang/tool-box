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
    class="w-full h-[80px] flex items-center px-[10px] border-t-(1px solid) border-[--borderColor] bg-[--bgColor]/95 backdrop-blur-sm relative"
    @drop="emit('drop', $event)"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave', $event)">
    <div v-if="!currentTrack" class="flex items-center justify-center w-full text-[--textColor3]">
      <div class="flex items-center gap-[15px]">
        <n-icon size="32" :depth="3">
          <FolderOutline />
        </n-icon>
        <div class="flex flex-col">
          <p class="text-[14px] font-medium">拖拽音频文件到此处</p>
          <p class="text-[12px] text-[--textColor3]">支持 MP3、WAV、FLAC、M4A、OGG、AAC 格式</p>
        </div>
        <n-button type="primary" size="medium" @click="selectFolder" class="shadow-lg">
          <template #icon>
            <n-icon>
              <FolderOutline />
            </n-icon>
          </template>
          选择文件夹
        </n-button>
      </div>
    </div>

    <div v-else class="flex items-center w-full">
      <!-- 专辑封面和歌曲信息 -->
      <div class="flex items-center gap-[12px] min-w-[200px] max-w-[300px]">
        <div
          class="size-[48px] rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center shadow-md relative overflow-hidden flex-shrink-0">
          <Motion
            v-if="isPlaying"
            class="absolute inset-0"
            :animate="{ rotate: 360 }"
            :transition="{ duration: 3, repeat: Infinity, ease: 'linear' }">
            <div
              class="w-full h-full rounded-full bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-700 relative">
              <div
                class="absolute inset-[2px] rounded-full bg-gradient-to-r from-blue-600 via-cyan-300 to-blue-600"></div>
              <div
                class="absolute inset-[4px] rounded-full bg-gradient-to-r from-blue-500 via-cyan-200 to-blue-500"></div>
              <div
                class="absolute inset-[6px] rounded-full bg-gradient-to-r from-blue-400 via-cyan-100 to-blue-400"></div>
            </div>
          </Motion>

          <div
            class="relative z-10 size-[20px] rounded-full bg-blue-50 flex items-center justify-center shadow"></div>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-[14px] font-medium text-[--textColor1] truncate">
            <AnimatePresence>
              <Motion
                v-if="getTrackTitle(currentTrack).length > 20"
                tag="span"
                class="inline-block"
                :animate="{ x: '-50%' }"
                :transition="{ duration: 15, repeat: Infinity, ease: 'linear' }">
                {{ getTrackTitle(currentTrack) }}
                　　{{ getTrackTitle(currentTrack) }}
              </Motion>
              <span v-else>
                {{ getTrackTitle(currentTrack) }}
              </span>
            </AnimatePresence>
          </h3>
          <p class="text-[12px] text-[--textColor3] truncate">
            {{ getTrackArtist(currentTrack) }}
          </p>
        </div>
      </div>

      <!-- 播放控制 -->
      <div class="flex items-center gap-[8px] mx-auto">
        <n-button
          circle
          size="small"
          quaternary
          @click="handlePlayPrevious"
          class="transition-transform hover:scale-110">
          <template #icon>
            <n-icon size="18">
              <PlaySkipBackOutline />
            </n-icon>
          </template>
        </n-button>

        <n-button
          circle
          size="medium"
          type="primary"
          @click="handleTogglePlay"
          class="w-[40px] h-[40px] shadow-lg transition-transform hover:scale-110">
          <template #icon>
            <n-icon size="20">
              <PauseOutline v-if="isPlaying" />
              <PlayOutline v-else />
            </n-icon>
          </template>
        </n-button>

        <n-button
          circle
          size="small"
          quaternary
          @click="handlePlayNext"
          class="transition-transform hover:scale-110">
          <template #icon>
            <n-icon size="18">
              <PlaySkipForwardOutline />
            </n-icon>
          </template>
        </n-button>
      </div>

      <!-- 进度条 -->
      <div class="flex-1 max-w-[300px] mx-[20px] relative">
        <n-slider
          :value="duration > 0 ? (currentTime / duration) * 100 : 0"
          :format-tooltip="() => formatTime(currentTime)"
          color="--primaryColor"
          @update:value="handleProgressChange"
          :disabled="isAnyLoading" />
        <div class="flex justify-between text-[10px] text-[--textColor3] mt-[2px]">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
        <div
          v-if="isAnyLoading"
          class="absolute inset-0 bg-[--bgColor]/50 flex items-center justify-center rounded">
          <n-spin size="small" :radius="8" />
        </div>
      </div>

      <!-- 播放模式和音量控制 -->
      <div class="flex items-center gap-[8px] min-w-[150px]">
        <n-button quaternary @click="togglePlayMode" size="tiny" class="transition-colors">
          <template #icon>
            <n-icon size="14">
              <component :is="currentPlayModeIcon" />
            </n-icon>
          </template>
          <span class="text-[11px]">{{ playModeLabel }}</span>
        </n-button>

        <div class="flex items-center gap-[4px]">
          <n-icon size="14" class="text-[--textColor3]">
            <VolumeHighOutline v-if="volume > 0" />
            <VolumeMuteOutline v-else />
          </n-icon>
          <n-slider
            :value="Math.round(volume * 100)"
            class="w-[60px]"
            color="--primaryColor"
            @update:value="handleVolumeChange" />
        </div>
      </div>
    </div>
  </div>
</template>

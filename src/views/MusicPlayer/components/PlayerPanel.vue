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
  ShuffleOutline,
  ChevronDownOutline
} from '@vicons/ionicons5'
import { useMusicPlayerContext } from '../contexts/PlayerContext'
import { useMusicPlayerStore } from '@/stores/musicPlayer'
import { eventBus } from '../utils/eventBus'
import { formatTime, getTrackTitle, getTrackArtist } from '../utils/musicUtils'

const emit = defineEmits<{
  drop: [event: DragEvent]
  dragover: [event: DragEvent]
  dragleave: [event: DragEvent]
  'toggle-full-screen': []
}>()

withDefaults(
  defineProps<{
    isFullScreen?: boolean
  }>(),
  {
    isFullScreen: false
  }
)

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

// 保存静音前的音量值
const previousVolume = ref<number>(0.8)

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
  // 如果音量大于 0，保存当前音量作为静音前的音量
  if (value > 0) {
    previousVolume.value = value / 100
  }
}

function handleVolumeToggle() {
  if (volume.value > 0) {
    // 当前有音量，保存当前音量并静音
    previousVolume.value = volume.value
    eventBus.emit('set-volume', 0)
  } else {
    // 当前静音，恢复之前的音量
    eventBus.emit('set-volume', previousVolume.value * 100)
  }
}

function handlePlayPrevious() {
  eventBus.emit('play-previous')
}

function handlePlayNext() {
  eventBus.emit('play-next')
}

function handleFullScreenToggle() {
  emit('toggle-full-screen')
}
</script>

<template>
  <div
    class="w-full flex items-center justify-center px-[10px] border-t-(1px solid) border-[--borderColor] bg-[--bgColor]/95 backdrop-blur-sm relative transition-all duration-300 ease-in-out"
    :class="{
      'h-[80px]': !isFullScreen,
      'h-screen min-h-0 flex-col': isFullScreen
    }"
    @drop="emit('drop', $event)"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave', $event)">
    <!-- 收缩按钮 -->
    <n-button
      v-if="isFullScreen"
      circle
      size="small"
      quaternary
      @click="handleFullScreenToggle"
      class="absolute top-[20px] right-[20px] z-10 transition-transform hover:scale-110">
      <template #icon>
        <n-icon size="18">
          <ChevronDownOutline />
        </n-icon>
      </template>
    </n-button>

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

    <div
      v-else
      class="flex items-center w-full h-full"
      :class="{
        'flex-col justify-center gap-[15px]': isFullScreen,
        'flex-row': !isFullScreen
      }">
      <!-- 专辑封面和歌曲信息 -->
      <div
        class="flex items-center gap-[12px] min-w-[200px] max-w-[300px]"
        :class="{ 'flex-col': isFullScreen }">
        <div
          class="size-[48px] rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center shadow-md relative overflow-hidden flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
          :class="{
            'h-[calc(100vh/3)] w-[calc(100vh/3)] max-h-[400px] max-w-[400px]': isFullScreen
          }"
          @click="!isFullScreen && handleFullScreenToggle()">
          <Motion
            v-if="isPlaying"
            class="absolute inset-0"
            :animate="{ rotate: 360 }"
            :transition="{ duration: 3, repeat: Infinity, ease: 'linear' }">
            <div
              class="w-full h-full rounded-full bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-700 relative">
              <div
                class="absolute inset-[3px] rounded-full bg-gradient-to-r from-blue-600 via-cyan-300 to-blue-600"></div>
              <div
                class="absolute inset-[6px] rounded-full bg-gradient-to-r from-blue-500 via-cyan-200 to-blue-500"></div>
              <div
                class="absolute inset-[9px] rounded-full bg-gradient-to-r from-blue-400 via-cyan-100 to-blue-400"></div>
            </div>
          </Motion>

          <div
            class="relative z-10 size-[20px] rounded-full bg-blue-50 flex items-center justify-center shadow"
            :class="{ 'size-[110px]': isFullScreen }"></div>
        </div>
        <div class="min-w-0 flex-1" :class="{ 'mt-6 text-center': isFullScreen }">
          <h3
            class="text-[14px] font-medium text-[--textColor1] truncate"
            :class="{ 'text-[24px] font-bold': isFullScreen }">
            <AnimatePresence>
              <Motion
                v-if="getTrackTitle(currentTrack).length > (isFullScreen ? 20 : 15)"
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
          <p
            class="text-[12px] text-[--textColor3] truncate"
            :class="{ 'text-[16px] mt-2': isFullScreen }">
            {{ getTrackArtist(currentTrack) }}
          </p>
        </div>
      </div>

      <!-- 播放控制 -->
      <div class="flex items-center gap-[8px] mx-auto" :class="{ 'gap-[20px]': isFullScreen }">
        <n-button
          circle
          size="small"
          quaternary
          @click="handlePlayPrevious"
          class="transition-transform hover:scale-110"
          :class="{ 'size-medium w-[50px] h-[50px]': isFullScreen }">
          <template #icon>
            <n-icon :size="isFullScreen ? 24 : 18">
              <PlaySkipBackOutline />
            </n-icon>
          </template>
        </n-button>

        <n-button
          circle
          size="medium"
          type="primary"
          @click="handleTogglePlay"
          class="shadow-lg transition-transform hover:scale-110"
          :class="isFullScreen ? 'size-[50px]' : 'size-[40px]'">
          <template #icon>
            <n-icon :size="isFullScreen ? 32 : 20">
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
          class="transition-transform hover:scale-110"
          :class="{ 'w-[50px] h-[50px]': isFullScreen }">
          <template #icon>
            <n-icon :size="isFullScreen ? 24 : 18">
              <PlaySkipForwardOutline />
            </n-icon>
          </template>
        </n-button>
      </div>

      <!-- 进度条 -->
      <div
        class="max-w-[300px] mx-[20px] relative"
        :class="{ 'max-w-[800px] mx-[50px] w-full': isFullScreen, 'flex-1': !isFullScreen }">
        <n-slider
          :value="duration > 0 ? (currentTime / duration) * 100 : 0"
          :format-tooltip="() => formatTime(currentTime)"
          color="--primaryColor"
          @update:value="handleProgressChange"
          :disabled="isAnyLoading"
          :class="{ 'h-2': isFullScreen }" />
        <div
          class="flex justify-between text-[10px] text-[--textColor3] mt-[2px]"
          :class="{ 'text-[14px] mt-3': isFullScreen }">
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
      <div
        class="flex items-center gap-[8px] min-w-[150px]"
        :class="{ 'min-w-[200px] gap-[15px]': isFullScreen }">
        <n-button
          quaternary
          @click="togglePlayMode"
          :size="isFullScreen ? 'small' : 'tiny'"
          class="transition-colors">
          <template #icon>
            <n-icon :size="isFullScreen ? 16 : 14">
              <component :is="currentPlayModeIcon" />
            </n-icon>
          </template>
          <span class="text-[11px]" :class="{ 'text-[12px]': isFullScreen }">{{
            playModeLabel
          }}</span>
        </n-button>

        <div class="flex items-center gap-[4px]" :class="{ 'gap-[10px]': isFullScreen }">
          <n-icon
            class="text-[--textColor3] cursor-pointer hover:text-[--primaryColor] transition-colors"
            :size="isFullScreen ? 18 : 14"
            @click="handleVolumeToggle">
            <VolumeHighOutline v-if="volume > 0" />
            <VolumeMuteOutline v-else />
          </n-icon>
          <n-slider
            :value="Math.round(volume * 100)"
            :class="isFullScreen ? 'w-[120px]' : 'w-[60px]'"
            color="--primaryColor"
            @update:value="handleVolumeChange" />
        </div>
      </div>
    </div>
  </div>
</template>

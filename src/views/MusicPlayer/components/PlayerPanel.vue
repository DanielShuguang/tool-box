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
  ChevronDownOutline,
  TextOutline
} from '@vicons/ionicons5'
import { useMusicPlayerContext } from '../contexts/PlayerContext'
import { useMusicPlayerStore } from '@/stores/musicPlayer'
import { useLyrics } from '../hooks/useLyrics'
import { useLyricsCache } from '../hooks/useLyricsCache'
import LyricsPanel from './LyricsPanel.vue'
import EditLyricsDialog from './EditLyricsDialog.vue'
import UploadLyricsDialog from './UploadLyricsDialog.vue'
import { eventBus } from '../utils/eventBus'
import { formatTime, getTrackTitle, getTrackArtist } from '../utils/musicUtils'

const message = useMessage()

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

const {
  loadLyrics,
  syncToTime,
  isVisible,
  toggleVisibility,
  lyricsState,
  currentLyrics,
  currentLineIndex,
  errorMessage,
  hasLyrics,
  currentLyricText,
  saveManualLyrics
} = useLyrics()

const { saveCache } = useLyricsCache()

const editDialogShow = ref(false)
const uploadDialogShow = ref(false)

watch(currentTrack, async track => {
  if (track) {
    await loadLyrics(track.id, {
      title: track.title,
      artist: track.artist
    })
  }
})

watch(currentTime, time => {
  syncToTime(time)
})

const previousVolume = ref<number>(0.8)

const playModeLabels: Record<string, string> = {
  sequence: '顺序播放',
  loop: '列表循环',
  single: '单曲循环',
  random: '随机播放'
}

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
  if (value > 0) {
    previousVolume.value = value / 100
  }
}

function handleVolumeToggle() {
  if (volume.value > 0) {
    previousVolume.value = volume.value
    eventBus.emit('set-volume', 0)
  } else {
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

function handleEditLyrics() {
  if (!currentTrack.value) {
    message.warning('请先播放音乐')
    return
  }
  editDialogShow.value = true
}

function handleUploadLyrics() {
  if (!currentTrack.value) {
    message.warning('请先播放音乐')
    return
  }
  uploadDialogShow.value = true
}

async function handleSaveEditedLyrics(lyrics: { time: number; text: string }[]) {
  if (!currentTrack.value) return

  try {
    await saveManualLyrics(currentTrack.value.id, lyrics, {
      title: getTrackTitle(currentTrack.value),
      artist: getTrackArtist(currentTrack.value)
    })

    const lyricsData = {
      trackId: currentTrack.value.id,
      songName: getTrackTitle(currentTrack.value),
      artist: getTrackArtist(currentTrack.value),
      source: 'Manual' as const,
      format: 'lrc' as const,
      cachedAt: new Date().toISOString(),
      lyrics
    }

    await saveCache(currentTrack.value.id, lyricsData)
    message.success('歌词已保存')
  } catch (error) {
    message.error('保存歌词失败')
    console.error('保存歌词失败:', error)
  }
}

async function handleSaveUploadedLyrics(
  lyrics: { time: number; text: string }[],
  _source: 'Upload'
) {
  if (!currentTrack.value) return

  try {
    const lyricsData = {
      trackId: currentTrack.value.id,
      songName: getTrackTitle(currentTrack.value),
      artist: getTrackArtist(currentTrack.value),
      source: 'Upload' as const,
      format: 'lrc' as const,
      cachedAt: new Date().toISOString(),
      lyrics
    }

    await saveCache(currentTrack.value.id, lyricsData)
    message.success('歌词已上传并保存')
  } catch (error) {
    message.error('保存歌词失败')
    console.error('保存歌词失败:', error)
  }
}
</script>

<template>
  <div
    class="w-full relative"
    :class="{
      'h-[80px]': !isFullScreen,
      'h-screen min-h-0 flex-col': isFullScreen
    }"
    @drop="emit('drop', $event)"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave', $event)">
    <div
      class="w-full flex items-center justify-center px-[10px] border-t-(1px solid) border-[--borderColor] bg-[--bgColor]/95 backdrop-blur-sm relative transition-all duration-300 ease-in-out h-full"
      :class="{ 'flex-col justify-center gap-[15px]': isFullScreen }">
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

      <div v-else class="flex items-center w-full h-full" :class="{ 'flex-col': isFullScreen }">
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
          :class="{
            'max-w-[800px] mx-[50px] w-full': isFullScreen,
            'flex-1 flex flex-col': !isFullScreen
          }">
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
          <div v-if="!isFullScreen && isVisible && hasLyrics" class="mt-1 text-center">
            <p class="text-[12px] text-[--textColor1] truncate px-2">
              {{ currentLyricText || '♪' }}
            </p>
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

          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button quaternary size="tiny" @click="toggleVisibility">
                <template #icon>
                  <n-icon :size="14">
                    <TextOutline />
                  </n-icon>
                </template>
              </n-button>
            </template>
            {{ isVisible ? '隐藏歌词' : '显示歌词' }}
          </n-tooltip>

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

    <LyricsPanel
      v-if="isFullScreen"
      :is-full-screen="isFullScreen"
      :lyrics-state="lyricsState"
      :current-lyrics="currentLyrics"
      :current-line-index="currentLineIndex"
      :is-visible="isVisible"
      :error-message="errorMessage"
      @edit-lyrics="handleEditLyrics"
      @upload-lyrics="handleUploadLyrics" />

    <EditLyricsDialog
      v-model:show="editDialogShow"
      :lyrics="currentLyrics"
      :song-name="getTrackTitle(currentTrack) || ''"
      :artist="getTrackArtist(currentTrack) || ''"
      @save="handleSaveEditedLyrics" />

    <UploadLyricsDialog
      v-model:show="uploadDialogShow"
      :song-name="getTrackTitle(currentTrack) || ''"
      :artist="getTrackArtist(currentTrack) || ''"
      @save="handleSaveUploadedLyrics" />
  </div>
</template>

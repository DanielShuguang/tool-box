<script setup lang="ts">
import { ChevronDownOutline, TextOutline, DesktopOutline } from '@vicons/ionicons5'
import { useMusicPlayerContext } from '../contexts/PlayerContext'
import { useMusicPlayerStore } from '@/stores/musicPlayer'
import { useLyrics } from '../hooks/useLyrics'
import { useLyricsCache } from '../hooks/useLyricsCache'
import { useLyricsDialog } from '../hooks/useLyricsDialog'
import { useDesktopLyrics } from '../hooks/useDesktopLyrics'
import { listen } from '@tauri-apps/api/event'
import LyricsPanel from './LyricsPanel.vue'
import EditLyricsDialog from './EditLyricsDialog.vue'
import UploadLyricsDialog from './UploadLyricsDialog.vue'
import PlayerControls from './PlayerControls.vue'
import ProgressBar from './ProgressBar.vue'
import VolumeControl from './VolumeControl.vue'
import PlayModeButton from './PlayModeButton.vue'
import AlbumCover from './AlbumCover.vue'
import TrackInfo from './TrackInfo.vue'
import EmptyPlayer from './EmptyPlayer.vue'
import { eventBus } from '../utils/eventBus'

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

const { isPlaying, isAnyLoading, currentTime, duration, handleProgressChange, selectFolder } =
  context

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

const {
  editDialogShow,
  uploadDialogShow,
  handleEditLyrics,
  handleUploadLyrics,
  handleSaveEditedLyrics,
  handleSaveUploadedLyrics
} = useLyricsDialog(saveManualLyrics, saveCache)

const {
  isLyricsWindowOpen,
  createLyricsWindow,
  closeLyricsWindow,
  sendLyricsToWindow,
  checkLyricsWindowOpen,
  clearLyricsWindow
} = useDesktopLyrics()

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

watch(currentLyricText, text => {
  if (text) {
    sendLyricsToWindow(text)
  } else {
    clearLyricsWindow()
  }
})

onMounted(async () => {
  await checkLyricsWindowOpen()

  const unlisten = await listen('lyrics-window-closed', () => {
    isLyricsWindowOpen.value = false
  })

  onUnmounted(() => {
    unlisten()
  })
})

const previousVolume = ref<number>(0.8)

const playModeLabels: Record<string, string> = {
  sequence: '顺序播放',
  loop: '列表循环',
  single: '单曲循环',
  random: '随机播放'
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

function handleTogglePlay() {
  eventBus.emit('toggle-play')
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

function handleSaveEditedLyricsWrapper(lyrics: { time: number; text: string }[]) {
  handleSaveEditedLyrics(currentTrack.value, lyrics)
}

function handleSaveUploadedLyricsWrapper(
  lyrics: { time: number; text: string }[],
  _source: 'Upload'
) {
  handleSaveUploadedLyrics(currentTrack.value, lyrics)
}

function handleEditLyricsWrapper() {
  handleEditLyrics(currentTrack.value)
}

function handleUploadLyricsWrapper() {
  handleUploadLyrics(currentTrack.value)
}

const playModeLabel = computed(() => {
  if (currentTrack.value) {
    return playModeLabels[playMode.value]
  }
  return ''
})

async function handleToggleDesktopLyrics() {
  if (isLyricsWindowOpen.value) {
    await closeLyricsWindow()
  } else {
    await createLyricsWindow()
    if (currentLyricText.value) {
      sendLyricsToWindow(currentLyricText.value)
    }
  }
}
</script>

<template>
  <div
    class="w-full relative"
    :class="{
      'h-[80px]': !isFullScreen,
      'h-screen min-h-0': isFullScreen
    }"
    @drop="emit('drop', $event)"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave', $event)">
    <template v-if="!isFullScreen">
      <div
        class="w-full flex items-center justify-center px-[10px] border-t-(1px solid) border-[--borderColor] bg-[--bgColor]/95 backdrop-blur-sm relative transition-all duration-300 ease-in-out h-full">
        <EmptyPlayer v-if="!currentTrack" :is-full-screen="false" @select-folder="selectFolder" />

        <div v-else class="flex items-center w-full h-full gap-[12px]">
          <AlbumCover :is-playing="isPlaying" size="small" @click="handleFullScreenToggle" />

          <TrackInfo :track="currentTrack" :is-full-screen="false" />

          <PlayerControls
            :is-playing="isPlaying"
            size="small"
            @play="handleTogglePlay"
            @play-previous="handlePlayPrevious"
            @play-next="handlePlayNext" />

          <ProgressBar
            :current-time="currentTime"
            :duration="duration"
            :is-any-loading="isAnyLoading"
            :is-full-screen="false"
            :show-lyric-preview="isVisible && hasLyrics"
            :current-lyric-text="currentLyricText"
            @progress-change="handleProgressChange" />

          <div class="flex items-center gap-[8px] min-w-[150px]">
            <PlayModeButton
              :play-mode="playMode"
              :label="playModeLabel"
              @toggle-play-mode="context.togglePlayMode" />

            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button quaternary size="tiny" @click="toggleVisibility">
                  <template #icon>
                    <n-icon size="14">
                      <TextOutline />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              {{ isVisible ? '隐藏歌词' : '显示歌词' }}
            </n-tooltip>

            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button quaternary size="tiny" @click="handleToggleDesktopLyrics">
                  <template #icon>
                    <n-icon size="14">
                      <DesktopOutline />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              {{ isLyricsWindowOpen ? '关闭桌面歌词' : '显示桌面歌词' }}
            </n-tooltip>

            <VolumeControl
              :volume="volume"
              size="small"
              @volume-change="handleVolumeChange"
              @volume-toggle="handleVolumeToggle" />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="w-full h-full flex">
        <div
          class="flex flex-col items-center justify-center px-[40px] border-r-(1px solid) border-[--borderColor]"
          style="width: 45%; min-width: 400px">
          <n-button
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

          <EmptyPlayer v-if="!currentTrack" :is-full-screen="true" @select-folder="selectFolder" />

          <template v-else>
            <div class="flex flex-col items-center gap-[20px] w-full">
              <AlbumCover :is-playing="isPlaying" size="large" @click="handleFullScreenToggle" />

              <div class="w-full overflow-hidden">
                <TrackInfo :track="currentTrack" :is-full-screen="true" />
              </div>

              <PlayerControls
                :is-playing="isPlaying"
                size="medium"
                @play="handleTogglePlay"
                @play-previous="handlePlayPrevious"
                @play-next="handlePlayNext" />

              <ProgressBar
                :current-time="currentTime"
                :duration="duration"
                :is-any-loading="isAnyLoading"
                :is-full-screen="true"
                @progress-change="handleProgressChange" />

              <div class="flex items-center gap-[15px] min-w-[200px]">
                <PlayModeButton
                  :play-mode="playMode"
                  :label="playModeLabel"
                  @toggle-play-mode="context.togglePlayMode" />

                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-button quaternary size="tiny" @click="toggleVisibility">
                      <template #icon>
                        <n-icon size="14">
                          <TextOutline />
                        </n-icon>
                      </template>
                    </n-button>
                  </template>
                  {{ isVisible ? '隐藏歌词' : '显示歌词' }}
                </n-tooltip>

                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-button quaternary size="tiny" @click="handleToggleDesktopLyrics">
                      <template #icon>
                        <n-icon size="14">
                          <DesktopOutline />
                        </n-icon>
                      </template>
                    </n-button>
                  </template>
                  {{ isLyricsWindowOpen ? '关闭桌面歌词' : '显示桌面歌词' }}
                </n-tooltip>

                <VolumeControl
                  :volume="volume"
                  size="large"
                  @volume-change="handleVolumeChange"
                  @volume-toggle="handleVolumeToggle" />
              </div>
            </div>
          </template>
        </div>

        <div class="flex-1 min-w-0 overflow-hidden" style="width: 55%">
          <LyricsPanel
            :is-full-screen="isFullScreen"
            :lyrics-state="lyricsState"
            :current-lyrics="currentLyrics"
            :current-line-index="currentLineIndex"
            :is-visible="isVisible"
            :error-message="errorMessage"
            @edit-lyrics="handleEditLyricsWrapper"
            @upload-lyrics="handleUploadLyricsWrapper" />
        </div>
      </div>
    </template>

    <EditLyricsDialog
      v-model:show="editDialogShow"
      :lyrics="currentLyrics"
      song-name=""
      artist=""
      @save="handleSaveEditedLyricsWrapper" />

    <UploadLyricsDialog
      v-model:show="uploadDialogShow"
      song-name=""
      artist=""
      @save="handleSaveUploadedLyricsWrapper" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MusicalNotesOutline, CreateOutline, CloudUploadOutline } from '@vicons/ionicons5'

const props = defineProps<{
  isFullScreen?: boolean
  lyricsState: 'idle' | 'loading' | 'success' | 'error' | 'empty'
  currentLyrics: Array<{ time: number; text: string }>
  currentLineIndex: number
  isVisible: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  'edit-lyrics': []
  'upload-lyrics': []
}>()

const hasLyrics = computed(() => {
  return props.lyricsState === 'success' && props.currentLyrics.length > 0
})

const currentLyricText = computed(() => {
  if (props.currentLineIndex >= 0 && props.currentLineIndex < props.currentLyrics.length) {
    return props.currentLyrics[props.currentLineIndex].text || '♪'
  }
  return ''
})

const previousLyricText = computed(() => {
  if (props.currentLineIndex > 0 && props.currentLineIndex - 1 < props.currentLyrics.length) {
    return props.currentLyrics[props.currentLineIndex - 1].text || ''
  }
  return ''
})

const nextLyricText = computed(() => {
  if (props.currentLineIndex + 1 < props.currentLyrics.length) {
    return props.currentLyrics[props.currentLineIndex + 1].text || ''
  }
  return ''
})

const lyricsStatusText = computed(() => {
  switch (props.lyricsState) {
    case 'loading':
      return '加载中...'
    case 'error':
      return props.errorMessage || '加载失败'
    case 'empty':
      return '暂无歌词'
    case 'idle':
      return '播放音乐时显示歌词'
    default:
      return ''
  }
})
</script>

<template>
  <div
    v-if="isVisible && isFullScreen"
    class="lyrics-panel w-full transition-all duration-300 flex-1 min-h-0 flex-col overflow-hidden px-8 py-4">
    <div
      v-if="!hasLyrics"
      class="flex flex-col items-center justify-center w-full h-full text-[--textColor3] gap-[8px]">
      <n-icon size="32" :depth="3">
        <MusicalNotesOutline />
      </n-icon>
      <p class="text-[12px]">{{ lyricsStatusText }}</p>
      <div v-if="lyricsState === 'empty' || lyricsState === 'idle'" class="flex gap-[8px]">
        <n-button size="small" quaternary @click="emit('upload-lyrics')">
          <template #icon>
            <n-icon size="14">
              <CloudUploadOutline />
            </n-icon>
          </template>
          上传歌词
        </n-button>
        <n-button size="small" quaternary @click="emit('edit-lyrics')">
          <template #icon>
            <n-icon size="14">
              <CreateOutline />
            </n-icon>
          </template>
          手动编辑
        </n-button>
      </div>
    </div>

    <div v-else class="w-full h-full flex flex-col items-center justify-center">
      <div class="flex flex-col items-center gap-[4px] w-full max-w-2xl">
        <p
          v-if="previousLyricText"
          class="text-[14px] text-[--textColor3] text-center truncate opacity-60">
          {{ previousLyricText }}
        </p>
        <p class="text-[24px] text-[--textColor1] font-bold text-center leading-relaxed">
          {{ currentLyricText || '♪' }}
        </p>
        <p
          v-if="nextLyricText"
          class="text-[14px] text-[--textColor3] text-center truncate opacity-60">
          {{ nextLyricText }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lyrics-panel {
  flex-shrink: 0;
}

.lyrics-line {
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 100%;
}
</style>

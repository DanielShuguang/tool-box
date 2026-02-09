<script setup lang="ts">
import { Motion } from 'motion-v'
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

const containerRef = useTemplateRef('container')
const containerHeight = ref(0)

/**
 * 行高配置（像素）
 */
const LINE_HEIGHT = 48
const CURRENT_LINE_HEIGHT = 56

/**
 * 计算容器可以显示的歌词行数
 */
const visibleLineCount = computed(() => {
  if (containerHeight.value <= 0) {
    return { before: 2, after: 2 }
  }

  // 计算可以显示的额外行数（上下各一半）
  const availableHeight = containerHeight.value - CURRENT_LINE_HEIGHT
  const totalExtraLines = Math.floor(availableHeight / LINE_HEIGHT)
  const halfLines = Math.floor(totalExtraLines / 2)

  return {
    before: Math.max(1, halfLines),
    after: Math.max(1, halfLines)
  }
})

/**
 * 获取当前歌词前后的歌词列表
 */
const displayedLyrics = computed(() => {
  if (!hasLyrics.value) {
    return { before: [], current: null, after: [] }
  }

  const { before, after } = visibleLineCount.value
  const currentIndex = props.currentLineIndex

  // 获取当前歌词之前的歌词
  const beforeLyrics: Array<{ index: number; text: string }> = []
  for (let i = Math.max(0, currentIndex - before); i < currentIndex; i++) {
    beforeLyrics.push({
      index: i,
      text: props.currentLyrics[i]?.text || ''
    })
  }

  // 获取当前歌词
  const currentLyric = {
    index: currentIndex,
    text: props.currentLyrics[currentIndex]?.text || '♪'
  }

  // 获取当前歌词之后的歌词
  const afterLyrics: Array<{ index: number; text: string }> = []
  for (
    let i = currentIndex + 1;
    i <= Math.min(props.currentLyrics.length - 1, currentIndex + after);
    i++
  ) {
    afterLyrics.push({
      index: i,
      text: props.currentLyrics[i]?.text || ''
    })
  }

  return { before: beforeLyrics, current: currentLyric, after: afterLyrics }
})

/**
 * 监听容器大小变化
 */
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight

    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerHeight.value = entry.contentRect.height
      }
    })

    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

const hasLyrics = computed(() => {
  return props.lyricsState === 'success' && props.currentLyrics.length > 0
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
    ref="container"
    class="lyrics-panel w-full h-full transition-all duration-300 flex flex-col overflow-hidden px-8">
    <!-- 无歌词状态 -->
    <div
      v-if="!hasLyrics"
      class="flex flex-col items-center justify-center w-full h-full text-[--textColor3] gap-[8px]">
      <Motion :animate="{ opacity: [0, 1], y: [-20, 0] }" :transition="{ duration: 0.5 }">
        <n-icon size="48" :depth="3">
          <MusicalNotesOutline />
        </n-icon>
      </Motion>
      <Motion
        :animate="{ opacity: [0, 1], y: [-10, 0] }"
        :transition="{ duration: 0.5, delay: 0.1 }">
        <p class="text-[14px]">{{ lyricsStatusText }}</p>
      </Motion>
      <div v-if="lyricsState === 'empty' || lyricsState === 'idle'" class="flex gap-[8px] mt-4">
        <Motion
          :animate="{ opacity: [0, 1], y: [-10, 0] }"
          :transition="{ duration: 0.5, delay: 0.2 }">
          <n-button size="small" quaternary @click="emit('upload-lyrics')">
            <template #icon>
              <n-icon size="16">
                <CloudUploadOutline />
              </n-icon>
            </template>
            上传歌词
          </n-button>
        </Motion>
        <Motion
          :animate="{ opacity: [0, 1], y: [-10, 0] }"
          :transition="{ duration: 0.5, delay: 0.3 }">
          <n-button size="small" quaternary @click="emit('edit-lyrics')">
            <template #icon>
              <n-icon size="16">
                <CreateOutline />
              </n-icon>
            </template>
            手动编辑
          </n-button>
        </Motion>
      </div>
    </div>

    <!-- 有歌词状态：歌词内容自适应高度展示 -->
    <div v-else class="w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <!-- 当前歌词之前的歌词 -->
      <div
        class="flex flex-col items-center gap-[8px] w-full max-w-2xl flex-shrink-0 overflow-hidden">
        <TransitionGroup name="lyric-fade-slide">
          <p
            v-for="lyric in displayedLyrics.before"
            :key="`before-${lyric.index}`"
            class="text-[18px] text-[--textColor3] text-center truncate opacity-50">
            {{ lyric.text }}
          </p>
        </TransitionGroup>
      </div>

      <!-- 当前歌词 -->
      <Motion
        :key="displayedLyrics.current?.index ?? 'current'"
        class="flex-shrink-0"
        :animate="{ opacity: [0, 1], scale: [0.95, 1], y: [10, 0] }"
        :transition="{ duration: 0.4, ease: 'easeOut' }">
        <p class="text-[32px] text-[--textColor1] font-bold text-center leading-relaxed mx-4">
          {{ displayedLyrics.current?.text || '♪' }}
        </p>
      </Motion>

      <!-- 当前歌词之后的歌词 -->
      <div
        class="flex flex-col items-center gap-[8px] w-full max-w-2xl flex-shrink-0 overflow-hidden">
        <TransitionGroup name="lyric-fade-slide">
          <p
            v-for="lyric in displayedLyrics.after"
            :key="`after-${lyric.index}`"
            class="text-[18px] text-[--textColor3] text-center truncate opacity-50">
            {{ lyric.text }}
          </p>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lyrics-panel {
  contain: strict;
}

/* 歌词淡入淡出滑动动画 */
.lyric-fade-slide-enter-active,
.lyric-fade-slide-leave-active {
  transition: all 0.4s ease;
}

.lyric-fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.lyric-fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.lyric-fade-slide-move {
  transition: transform 0.4s ease;
}
</style>

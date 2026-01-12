<script setup lang="ts">
import { formatTime } from '../utils/musicUtils'

const props = withDefaults(
  defineProps<{
    currentTime?: number
    duration?: number
    isAnyLoading?: boolean
    isFullScreen?: boolean
    showLyricPreview?: boolean
    currentLyricText?: string
  }>(),
  {
    currentTime: 0,
    duration: 0,
    isAnyLoading: false,
    isFullScreen: false,
    showLyricPreview: false,
    currentLyricText: ''
  }
)

const emit = defineEmits<{
  'progress-change': [value: number]
}>()

const progress = computed(() => {
  if (props.duration > 0) {
    return (props.currentTime / props.duration) * 100
  }
  return 0
})

const textSize = computed(() => {
  return props.isFullScreen ? 'text-[14px]' : 'text-[10px]'
})

const sliderHeight = computed(() => {
  return props.isFullScreen ? 'h-2' : ''
})

const containerClass = computed(() => {
  return props.isFullScreen ? 'w-full' : 'max-w-[300px] mx-[20px] relative flex-1 flex flex-col'
})
</script>

<template>
  <div :class="containerClass">
    <n-slider
      :value="progress"
      :format-tooltip="() => formatTime(currentTime)"
      color="--primaryColor"
      @update:value="emit('progress-change', $event)"
      :disabled="isAnyLoading"
      :class="sliderHeight" />
    <div class="flex justify-between mt-[2px]" :class="textSize + ' text-[--textColor3]'">
      <span>{{ formatTime(currentTime) }}</span>
      <span>{{ formatTime(duration) }}</span>
    </div>
    <div
      v-if="isAnyLoading"
      class="absolute inset-0 bg-[--bgColor]/50 flex items-center justify-center rounded">
      <n-spin size="small" :radius="8" />
    </div>
    <div v-if="!isFullScreen && showLyricPreview && currentLyricText" class="mt-1 text-center">
      <p class="text-[12px] text-[--textColor1] truncate px-2">
        {{ currentLyricText }}
      </p>
    </div>
  </div>
</template>

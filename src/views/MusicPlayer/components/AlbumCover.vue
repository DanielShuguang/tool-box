<script setup lang="ts">
import { Motion } from 'motion-v'

const props = withDefaults(
  defineProps<{
    isPlaying?: boolean
    size?: 'small' | 'large'
  }>(),
  {
    isPlaying: false,
    size: 'small'
  }
)

const emit = defineEmits<{
  click: []
}>()

const containerSize = computed(() => {
  if (props.size === 'small') {
    return 'size-[48px]'
  }
  return 'size-[calc(100vh/3)] max-w-[400px]'
})

const innerCircleSize = computed(() => {
  if (props.size === 'small') {
    return 'size-[20px]'
  }
  return 'size-[110px]'
})
</script>

<template>
  <div
    :class="containerSize"
    class="rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center relative overflow-hidden cursor-pointer transition-transform hover:scale-105 shadow-md"
    @click="emit('click')">
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
      :class="innerCircleSize"
      class="relative z-10 rounded-full bg-blue-50 flex items-center justify-center shadow"></div>
  </div>
</template>

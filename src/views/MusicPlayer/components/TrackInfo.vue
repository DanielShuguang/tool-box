<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'
import { getTrackTitle, getTrackArtist } from '../utils/musicUtils'

const props = withDefaults(
  defineProps<{
    track?: any
    isFullScreen?: boolean
  }>(),
  {
    track: null,
    isFullScreen: false
  }
)

const titleSize = computed(() => {
  return props.isFullScreen ? 'text-[24px] font-bold' : 'text-[14px] font-medium'
})

const artistSize = computed(() => {
  return props.isFullScreen ? 'text-[16px] mt-2' : 'text-[12px]'
})

const textAlignClass = computed(() => {
  return props.isFullScreen ? 'text-center' : ''
})

const displayTitle = computed(() => {
  return getTrackTitle(props.track) || ''
})

const displayArtist = computed(() => {
  return getTrackArtist(props.track) || ''
})

const shouldAnimate = computed(() => {
  return props.isFullScreen ? displayTitle.value.length > 20 : displayTitle.value.length > 15
})
</script>

<template>
  <div v-if="track" class="min-w-0 flex-1" :class="textAlignClass">
    <h3 :class="[titleSize, 'text-[--textColor1] overflow-hidden']">
      <AnimatePresence>
        <Motion
          v-if="shouldAnimate"
          tag="span"
          class="inline-block text-nowrap"
          :animate="{ x: '-50%' }"
          :transition="{ duration: 15, repeat: Infinity, ease: 'linear' }">
          {{ displayTitle }}　　{{ displayTitle }}
        </Motion>
        <span v-else>
          {{ displayTitle }}
        </span>
      </AnimatePresence>
    </h3>
    <p :class="artistSize + ' text-[--textColor3] truncate'">
      {{ displayArtist }}
    </p>
  </div>
</template>

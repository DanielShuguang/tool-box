<script setup lang="ts">
import {
  PlayOutline,
  PauseOutline,
  PlaySkipBackOutline,
  PlaySkipForwardOutline
} from '@vicons/ionicons5'

const props = withDefaults(
  defineProps<{
    isPlaying?: boolean
    size?: 'small' | 'medium'
  }>(),
  {
    isPlaying: false,
    size: 'medium'
  }
)

const emit = defineEmits<{
  play: []
  'play-previous': []
  'play-next': []
}>()

const buttonSizeClass = computed(() => {
  if (props.size === 'small') {
    return 'size-[32px]'
  }
  return 'size-[50px]'
})

const iconSize = computed(() => {
  if (props.size === 'small') {
    return 18
  }
  return 24
})

const playButtonSize = computed(() => {
  if (props.size === 'small') {
    return 'size-[40px]'
  }
  return 'size-[50px]'
})

const playIconSize = computed(() => {
  if (props.size === 'small') {
    return 20
  }
  return 32
})

const gapClass = computed(() => {
  if (props.size === 'small') {
    return 'gap-[8px]'
  }
  return 'gap-[20px]'
})
</script>

<template>
  <div class="flex items-center" :class="gapClass">
    <n-button
      circle
      :size="size"
      quaternary
      @click="emit('play-previous')"
      class="transition-transform hover:scale-110"
      :class="buttonSizeClass">
      <template #icon>
        <n-icon :size="iconSize">
          <PlaySkipBackOutline />
        </n-icon>
      </template>
    </n-button>

    <n-button
      circle
      type="primary"
      @click="emit('play')"
      class="shadow-lg transition-transform hover:scale-110"
      :class="playButtonSize">
      <template #icon>
        <n-icon :size="playIconSize">
          <PauseOutline v-if="isPlaying" />
          <PlayOutline v-else />
        </n-icon>
      </template>
    </n-button>

    <n-button
      circle
      :size="size"
      quaternary
      @click="emit('play-next')"
      class="transition-transform hover:scale-110"
      :class="buttonSizeClass">
      <template #icon>
        <n-icon :size="iconSize">
          <PlaySkipForwardOutline />
        </n-icon>
      </template>
    </n-button>
  </div>
</template>

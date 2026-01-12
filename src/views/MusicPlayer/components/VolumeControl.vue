<script setup lang="ts">
import { VolumeHighOutline, VolumeMuteOutline } from '@vicons/ionicons5'

const props = withDefaults(
  defineProps<{
    volume?: number
    size?: 'small' | 'large'
  }>(),
  {
    volume: 0,
    size: 'small'
  }
)

const emit = defineEmits<{
  'volume-change': [value: number]
  'volume-toggle': []
}>()

const iconSize = computed(() => {
  return props.size === 'small' ? 14 : 18
})

const sliderWidth = computed(() => {
  return props.size === 'small' ? 'w-[60px]' : 'w-[120px]'
})

const buttonGap = computed(() => {
  return props.size === 'small' ? 'gap-[4px]' : 'gap-[10px]'
})

const volumePercent = computed(() => Math.round(props.volume * 100))
</script>

<template>
  <div class="flex items-center" :class="buttonGap">
    <n-icon
      class="text-[--textColor3] cursor-pointer hover:text-[--primaryColor] transition-colors"
      :size="iconSize"
      @click="emit('volume-toggle')">
      <VolumeHighOutline v-if="volume > 0" />
      <VolumeMuteOutline v-else />
    </n-icon>
    <n-slider
      :value="volumePercent"
      :class="sliderWidth"
      color="--primaryColor"
      @update:value="emit('volume-change', $event)" />
  </div>
</template>

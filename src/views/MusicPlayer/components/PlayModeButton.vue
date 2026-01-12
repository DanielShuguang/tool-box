<script setup lang="ts">
import { RepeatOutline, ShuffleOutline } from '@vicons/ionicons5'

const props = defineProps<{
  playMode?: 'sequence' | 'loop' | 'single' | 'random'
  label?: string
}>()

const emit = defineEmits<{
  'toggle-play-mode': []
}>()

const playModeIcons: Record<string, any> = {
  sequence: RepeatOutline,
  loop: RepeatOutline,
  single: RepeatOutline,
  random: ShuffleOutline
}

const currentPlayModeIcon = computed(() => playModeIcons[props.playMode || 'sequence'])
</script>

<template>
  <n-button quaternary size="small" @click="emit('toggle-play-mode')" class="transition-colors">
    <template #icon>
      <n-icon size="16">
        <component :is="currentPlayModeIcon" />
      </n-icon>
    </template>
    <span class="text-[12px]">{{ label }}</span>
  </n-button>
</template>

<script setup lang="ts">
import { FolderOutline } from '@vicons/ionicons5'

const props = withDefaults(
  defineProps<{
    isFullScreen?: boolean
  }>(),
  {
    isFullScreen: false
  }
)

const emit = defineEmits<{
  'select-folder': []
}>()

const containerClass = computed(() => {
  return props.isFullScreen
    ? 'flex items-center justify-center w-full text-[--textColor3]'
    : 'flex items-center justify-center w-full text-[--textColor3]'
})
</script>

<template>
  <div :class="containerClass">
    <div class="flex items-center gap-[15px]">
      <n-icon size="32" :depth="3">
        <FolderOutline />
      </n-icon>
      <div class="flex flex-col">
        <p class="text-[14px] font-medium">拖拽音频文件到此处</p>
        <p class="text-[12px] text-[--textColor3]">支持 MP3、WAV、FLAC、M4A、OGG、AAC 格式</p>
      </div>
      <n-button type="primary" size="medium" @click="emit('select-folder')" class="shadow-lg">
        <template #icon>
          <n-icon>
            <FolderOutline />
          </n-icon>
        </template>
        选择文件夹
      </n-button>
    </div>
  </div>
</template>

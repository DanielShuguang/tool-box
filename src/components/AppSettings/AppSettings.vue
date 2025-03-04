<script lang="ts" setup>
import { isDevelopment } from '@/utils/development'
import { useAppAutostart, useGenerateTrayIcon } from './logic'

defineProps<{ open: boolean }>()

const state = useLocalStorage('app-settings', {
  autostart: false,
  enableTrayIcon: false
})

onMounted(() => {
  if (isDevelopment) {
    state.value = {
      autostart: false,
      enableTrayIcon: false
    }
  }
})

const { autostart, enableTrayIcon } = toRefs(state.value)

const { toggleTrayIcon } = useGenerateTrayIcon(enableTrayIcon)

const { toggleAutostart } = useAppAutostart(autostart)
</script>
<template>
  <div v-if="open">
    <h1>应用设置</h1>

    <n-form label-placement="left">
      <n-form-item label="开机启动">
        <n-switch :value="autostart" @update:value="toggleAutostart" />
      </n-form-item>
      <n-form-item label="托盘图标">
        <n-switch :value="enableTrayIcon" @update:value="toggleTrayIcon" />
        <span class="ml-[15px]">开启后点击关闭不会彻底退出应用</span>
      </n-form-item>
    </n-form>
  </div>
</template>

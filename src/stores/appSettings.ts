import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ConfigFile } from '@/utils/storage'
import { emitter } from '@/utils/event'

export interface AppSettingsState {
  autostart: boolean
  enableTrayIcon: boolean
  themeAutoFollow: boolean
  isDark: boolean
}

export const useAppSettingsStore = defineStore(
  'appSettings',
  () => {
    const autostart = ref(false)
    const enableTrayIcon = ref(false)
    const themeAutoFollow = ref(false)
    const isDark = ref(false)

    // 同步 isDark 状态到 DOM 和事件
    function updateTheme(val: boolean) {
      // 确保 DOM 已准备好
      if (typeof document !== 'undefined' && document.documentElement) {
        if (val) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      // 发送主题变更事件
      emitter.emit('theme-change', val)
    }

    watch(
      isDark,
      val => {
        updateTheme(val)
      },
      { immediate: true }
    )

    return {
      autostart,
      enableTrayIcon,
      themeAutoFollow,
      isDark
    }
  },
  {
    persist: {
      fileName: ConfigFile.Settings,
      key: 'app-settings'
    }
  }
)

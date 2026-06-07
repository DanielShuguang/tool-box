import { ConfigFile } from '@/utils/storage'

export interface AppSettingsState {
  autostart: boolean
  enableTrayIcon: boolean
  themeAutoFollow: boolean
  isDark: boolean
  screenshot: {
    shortcuts: {
      captureFullScreen: string
      captureRegion: string
      captureWindow: string
    }
    save: {
      defaultFormat: 'png' | 'jpg'
      defaultPath: string
      autoCopyToClipboard: boolean
    }
  }
}

export const useAppSettingsStore = defineStore(
  'appSettings',
  () => {
    const autostart = ref(false)
    const enableTrayIcon = ref(false)
    const themeAutoFollow = ref(false)
    const isDark = ref(false)
    const screenshot = ref({
      shortcuts: {
        captureFullScreen: 'Ctrl+Shift+S',
        captureRegion: 'Ctrl+Shift+A',
        captureWindow: 'Ctrl+Shift+W'
      },
      save: {
        defaultFormat: 'png' as 'png' | 'jpg',
        defaultPath: '',
        autoCopyToClipboard: false
      }
    })

    // 获取系统主题
    function getSystemTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    // 当启用/禁用主题跟随系统时，同步主题
    watch(
      themeAutoFollow,
      val => {
        if (val) {
          isDark.value = getSystemTheme()
        }
      },
      { immediate: true }
    )

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
      isDark,
      screenshot
    }
  },
  {
    persist: {
      fileName: ConfigFile.Settings,
      key: 'app-settings'
    }
  }
)

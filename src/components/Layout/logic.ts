import { storeToRefs } from 'pinia'
import { emitter } from '@/utils/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useThemeVars } from 'naive-ui'
import { useAppSettingsStore } from '@/stores/appSettings'

export function useSystemTheme() {
  const appSettingsStore = useAppSettingsStore()
  const { themeAutoFollow, isDark } = storeToRefs(appSettingsStore)

  function handleChangeTheme() {
    isDark.value = !isDark.value
  }

  function handleChangeThemeState() {
    themeAutoFollow.value = !themeAutoFollow.value
    if (themeAutoFollow.value) {
      getThemeBySystem()
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', getThemeBySystem)
    } else {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', getThemeBySystem)
    }
  }

  function getThemeBySystem() {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  onMounted(() => {
    // 确保主题状态同步到 DOM（处理数据加载时机问题）
    if (typeof document !== 'undefined' && document.documentElement) {
      if (isDark.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  })

  return { isDark, themeAutoFollow, handleChangeTheme, handleChangeThemeState }
}

export function useUpdateThemeVariables() {
  const vars = useThemeVars()

  watch(
    vars,
    async () => {
      const bodyStyle = document.body.style

      await nextTick()
      Object.entries(vars.value).forEach(([key, value]) => {
        bodyStyle.setProperty(`--${key}`, value)
      })
    },
    { immediate: true }
  )
}

export function useToggleSettingsView() {
  const openSettings = ref(false)

  function toggleSettingsView() {
    openSettings.value = !openSettings.value
  }

  return { toggleSettingsView, openSettings }
}

export function useAppWindowOperation() {
  function handleMaximize() {
    getCurrentWindow().toggleMaximize()
  }

  function exitApp() {
    emitter.emit('close-window')
  }

  function handleMinimize() {
    getCurrentWindow().minimize()
  }

  return { handleMaximize, handleMinimize, exitApp }
}

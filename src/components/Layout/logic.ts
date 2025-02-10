import { emitter } from '@/utils/event'
import { useThemeVars } from 'naive-ui'

export function useSystemTheme() {
  const isAuto = useLocalStorage('theme-state', false)
  const isDark = useDark({ selector: 'html' })

  function handleChangeTheme() {
    isDark.value = !isDark.value
  }

  function handleChangeThemeState() {
    isAuto.value = !isAuto.value
    if (isAuto.value) {
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
    if (isAuto.value) {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    emitter.emit('theme-change', isDark.value)
  })

  watch(isDark, val => emitter.emit('theme-change', val))

  return { isDark, isAuto, handleChangeTheme, handleChangeThemeState }
}

export function useUpdateThemeVariables(isDark: ComputedRef<boolean>) {
  const vars = useThemeVars()

  watch(
    isDark,
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

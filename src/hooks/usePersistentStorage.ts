import { load, save } from '@/utils/storage'
import { onMounted, ref, watch } from 'vue'

export function usePersistentStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue)
  let isInitialized = false

  onMounted(async () => {
    try {
      data.value = await load(key, defaultValue)
      isInitialized = true
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  })

  watch(
    data,
    async newValue => {
      // 避免初始化时触发保存
      if (!isInitialized) return

      try {
        await save(key, newValue)
      } catch (error) {
        console.error('Failed to save settings:', error)
      }
    },
    { flush: 'post' }
  )

  return data
}

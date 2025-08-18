import { load, save, ConfigFile } from '@/utils/storage'
import { TimeUnits } from '@/utils/time'

/**
 * 持久化存储组合式函数
 *
 * 该函数提供了一个响应式数据存储，能够在数据变化时自动保存到持久化存储中，
 * 并在组件挂载时从持久化存储中加载数据。
 *
 * @param key - 存储键名，用于标识存储的数据
 * @param defaultValue - 默认值，当存储中没有找到对应数据时使用
 * @param configFile - 配置文件对象，可选参数，用于指定存储配置
 * @returns 返回一个响应式引用，包含存储的数据
 */
export function usePersistentStorage<T>(key: string, defaultValue: T, configFile?: ConfigFile) {
  const data = ref<T>(defaultValue)
  let isInitialized = false

  // 组件挂载时从持久化存储中加载数据
  onMounted(async () => {
    try {
      data.value = await load(key, defaultValue, configFile)
      isInitialized = true
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  })

  // 监听数据变化，当数据变化时自动保存到持久化存储
  watchDebounced(
    data,
    async newValue => {
      // 避免初始化时触发保存
      if (!isInitialized) return

      try {
        await save(key, newValue, configFile)
      } catch (error) {
        console.error('Failed to save settings:', error)
      }
    },
    { flush: 'post', debounce: TimeUnits.Second }
  )

  return data
}

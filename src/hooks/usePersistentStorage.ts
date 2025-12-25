import { load, save, ConfigFile } from '@/utils/storage'
import { TimeUnits } from '@/utils/time'

interface SharedDataCache {
  data: Ref<unknown>
  loading: boolean
  subscribers: Set<string>
}

const sharedDataCache = new Map<string, SharedDataCache>()

function getCacheKey(key: string, configFile?: ConfigFile): string {
  return configFile ? `${configFile}:${key}` : key
}

export function usePersistentStorage<T>(key: string, defaultValue: T, configFile?: ConfigFile) {
  const cacheKey = getCacheKey(key, configFile)

  if (!sharedDataCache.has(cacheKey)) {
    sharedDataCache.set(cacheKey, {
      data: ref<T>(defaultValue) as Ref<T>,
      loading: false,
      subscribers: new Set()
    })
  }

  const cache = sharedDataCache.get(cacheKey)!
  const subscriberId = Math.random().toString(36).slice(2, 9)
  cache.subscribers.add(subscriberId)

  let isInitialized = false

  async function loadData() {
    if (cache.loading) return
    cache.loading = true
    try {
      const loadedValue = await load(key, defaultValue, configFile)
      cache.data.value = loadedValue as T
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      cache.loading = false
    }
  }

  onMounted(() => {
    if (!isInitialized) {
      loadData()
      isInitialized = true
    }
  })

  onUnmounted(() => {
    cache.subscribers.delete(subscriberId)
    if (cache.subscribers.size === 0) {
      sharedDataCache.delete(cacheKey)
    }
  })

  watchDebounced(
    cache.data,
    async newValue => {
      if (!isInitialized) return
      try {
        await save(key, newValue, configFile)
      } catch (error) {
        console.error('Failed to save settings:', error)
      }
    },
    { flush: 'post', debounce: TimeUnits.Second }
  )

  return cache.data as Ref<T>
}

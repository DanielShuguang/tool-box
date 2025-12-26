import type { PiniaPlugin } from 'pinia'
import { load, save, ConfigFile } from '@/utils/storage'
import { TimeUnits } from '@/utils/time'
import { watchDebounced } from '@vueuse/core'

export interface PersistOptions {
  fileName?: ConfigFile
  key?: string
  debounce?: number
  keys?: string[]
}

export function createPiniaStorage(globalOptions?: PersistOptions): PiniaPlugin {
  return function persistPlugin(context) {
    const storeId = context.store.$id
    const persistOptions = (context.options as { persist?: PersistOptions }).persist
    const {
      fileName = globalOptions?.fileName ?? ConfigFile.Settings,
      key = globalOptions?.key ?? storeId,
      debounce = globalOptions?.debounce ?? TimeUnits.Second,
      keys: persistKeys
    } = persistOptions || globalOptions || {}

    async function loadState() {
      try {
        const value = await load(key, undefined, fileName)
        if (value != null) {
          const data = persistKeys
            ? persistKeys.reduce(
                (acc, k) =>
                  k in (value as Record<string, unknown>)
                    ? { ...acc, [k]: (value as Record<string, unknown>)[k] }
                    : acc,
                {} as Record<string, unknown>
              )
            : value
          context.store.$patch(data as any)
        }
      } catch (error) {
        console.error(`Failed to load state for ${key}:`, error)
      }
    }

    loadState()

    watchDebounced(
      context.store.$state,
      async state => {
        try {
          if (persistKeys) {
            const filtered = persistKeys.reduce<Record<string, unknown>>(
              (acc, k) => ((acc[k] = state[k]), acc),
              {}
            )
            await save(key, filtered, fileName)
          } else {
            await save(key, state, fileName)
          }
        } catch (error) {
          console.error(`Failed to save state for ${key}:`, error)
        }
      },
      { debounce, deep: true }
    )
  }
}

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

function createStoreReadyState() {
  const isReady = ref(false)
  let resolve: (() => void) | null = null
  const promise = new Promise<void>(r => {
    resolve = r
  })

  function markReady() {
    isReady.value = true
    resolve?.()
  }

  return {
    isReady,
    promise,
    markReady
  }
}

export function createPiniaStorage(globalOptions?: PersistOptions): PiniaPlugin {
  return function persistPlugin(context) {
    const persistOptions = context.options.persist

    if (!persistOptions) {
      return
    }

    const readyState = createStoreReadyState()

    Object.defineProperty(context.store, '$ready', {
      get() {
        return {
          isReady: readyState.isReady,
          waitForReady: () => readyState.promise
        }
      },
      enumerable: false,
      configurable: false
    })

    const {
      fileName = globalOptions?.fileName ?? ConfigFile.Settings,
      key = globalOptions?.key ?? context.store.$id,
      debounce = globalOptions?.debounce ?? TimeUnits.Second,
      keys: persistKeys
    } = persistOptions

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
      } finally {
        readyState.markReady()
      }
    }

    loadState()

    watchDebounced(
      () => context.store.$state,
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

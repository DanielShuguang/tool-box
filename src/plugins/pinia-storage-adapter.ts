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

let restorePromise: Promise<void> | null = null
let restoreResolve: (() => void) | null = null
const pendingStores = new Set<string>()

function createRestorePromise() {
  restorePromise = new Promise(resolve => {
    restoreResolve = resolve
  })
  pendingStores.clear()
}

createRestorePromise()

export function waitForRestore(): Promise<void> {
  return restorePromise!
}

function markStoreRestored(storeId: string) {
  pendingStores.delete(storeId)
  if (pendingStores.size === 0 && restoreResolve) {
    restoreResolve()
    createRestorePromise()
  }
}

export function createPiniaStorage(globalOptions?: PersistOptions): PiniaPlugin {
  return function persistPlugin(context) {
    const persistOptions = context.options.persist

    // 如果 store 没有配置 persist 选项，则不启用持久化
    if (!persistOptions) {
      return
    }

    const storeId = context.store.$id
    pendingStores.add(storeId)

    const {
      fileName = globalOptions?.fileName ?? ConfigFile.Settings,
      key = globalOptions?.key ?? storeId,
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
        markStoreRestored(storeId)
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

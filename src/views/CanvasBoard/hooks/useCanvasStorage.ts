/**
 * 画布存储 Hook
 *
 * 使用 Tauri store 持久化画布数据
 */
import { Store } from '@tauri-apps/plugin-store'
import type { HistoryState } from '../types'
import { AUTO_SAVE_MAX_AGE } from '../constants'

const STORAGE_KEY = 'canvas.autoSave'
const STORAGE_VERSION = 1
const STORE_FILE = '.canvas.dat'

interface CanvasAutoSaveData {
  state: HistoryState
  timestamp: number
  version: number
}

let storeInstance: Store | null = null

async function getStore(): Promise<Store> {
  if (!storeInstance) {
    storeInstance = await Store.load(STORE_FILE)
  }
  return storeInstance
}

export function useCanvasStorage() {
  const save = async (json: string): Promise<void> => {
    try {
      const store = await getStore()
      const state: HistoryState = { json, timestamp: Date.now() }
      const data: CanvasAutoSaveData = {
        state,
        timestamp: Date.now(),
        version: STORAGE_VERSION
      }
      await store.set(STORAGE_KEY, data)
      await store.save()
    } catch (error) {
      console.error('[useCanvasStorage] 保存画布数据失败', error)
    }
  }

  const load = async (): Promise<HistoryState | null> => {
    try {
      const store = await getStore()
      const data = await store.get<CanvasAutoSaveData>(STORAGE_KEY)

      if (!data) {
        return null
      }

      if (!data.state || !data.state.json) {
        await clear()
        return null
      }

      if (typeof data.state.json !== 'string') {
        await clear()
        return null
      }

      const saveTimestamp = data.timestamp ?? data.state.timestamp
      if (saveTimestamp && Date.now() - saveTimestamp > AUTO_SAVE_MAX_AGE) {
        await clear()
        return null
      }

      return data.state
    } catch (error) {
      console.error('[useCanvasStorage] 加载画布数据失败', error)
      await clear()
      return null
    }
  }

  const clear = async (): Promise<void> => {
    try {
      const store = await getStore()
      await store.delete(STORAGE_KEY)
      await store.save()
    } catch (error) {
      console.error('[useCanvasStorage] 清除画布数据失败', error)
    }
  }

  return {
    save,
    load,
    clear
  }
}

import { StorageAdapter } from './interface'
import { IndexedDBAdapter } from './indexeddb'
import { TauriStoreAdapter } from './tauri-store'

// 存储工厂函数，根据环境自动选择合适的存储方式
export function createStorageAdapter(
  fileName?: string,
  tableName: string = 'storage'
): StorageAdapter {
  // 检测环境，优先使用IndexedDB
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    return new IndexedDBAdapter(tableName)
  }
  // 降级到Tauri Store
  return new TauriStoreAdapter(fileName)
}

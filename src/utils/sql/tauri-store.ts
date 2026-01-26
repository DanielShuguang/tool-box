import { Store } from '@tauri-apps/plugin-store'
import { StorageAdapter } from './interface'

// Tauri Store适配器
export class TauriStoreAdapter implements StorageAdapter {
  private store: Store | null = null
  private fileName: string

  constructor(fileName: string = '.storage.dat') {
    this.fileName = fileName
  }

  // 初始化存储
  async init(): Promise<void> {
    if (!this.store) {
      this.store = await Store.load(this.fileName)
    }
  }

  // 保存数据
  async save<T>(key: string, value: T): Promise<void> {
    await this.init()
    if (this.store) {
      await this.store.set(key, value)
      await this.store.save()
    }
  }

  // 加载数据
  async load<T>(key: string, defaultValue: T): Promise<T> {
    await this.init()
    if (this.store) {
      return (await this.store.get(key)) ?? defaultValue
    }
    return defaultValue
  }

  // 删除数据
  async remove(key: string): Promise<void> {
    await this.init()
    if (this.store) {
      await this.store.delete(key)
      await this.store.save()
    }
  }

  // 清空存储
  async clear(): Promise<void> {
    await this.init()
    if (this.store) {
      const keys = await this.keys()
      for (const key of keys) {
        await this.store.delete(key)
      }
      await this.store.save()
    }
  }

  // 获取所有键
  async keys(): Promise<string[]> {
    await this.init()
    if (this.store) {
      // Tauri Store没有直接获取所有键的方法，这里返回空数组
      // 实际使用中可以根据需要扩展
      return []
    }
    return []
  }
}

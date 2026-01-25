import { StorageAdapter } from './interface'
import { Dexie } from 'dexie'

// 定义存储项接口
interface StorageItem {
  key: string
  value: any
}

// 创建Dexie子类
class ToolBoxDB extends Dexie {
  // 定义存储表
  storage: Dexie.Table<StorageItem, string>

  constructor() {
    super('tool-box-db')

    // 定义数据库模式
    this.version(1).stores({
      storage: 'key' // 主键为key
    })

    // 初始化存储表
    this.storage = this.table('storage')
  }
}

export class IndexedDBAdapter implements StorageAdapter {
  private db: ToolBoxDB

  constructor() {
    this.db = new ToolBoxDB()
  }

  // 初始化存储（Dexie会自动处理）
  async init(): Promise<void> {
    // Dexie会在第一次访问时自动初始化
    await this.db.open()
  }

  // 保存数据
  async save<T>(key: string, value: T): Promise<void> {
    await this.db.storage.put({ key, value })
  }

  // 加载数据
  async load<T>(key: string, defaultValue: T): Promise<T> {
    const item = await this.db.storage.get(key)
    return item ? item.value : defaultValue
  }

  // 删除数据
  async remove(key: string): Promise<void> {
    await this.db.storage.delete(key)
  }

  // 清空存储
  async clear(): Promise<void> {
    await this.db.storage.clear()
  }

  // 获取所有键
  async keys(): Promise<string[]> {
    const items = await this.db.storage.toArray()
    return items.map(item => item.key)
  }
}

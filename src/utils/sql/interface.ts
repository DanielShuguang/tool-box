// 统一存储接口
export interface StorageAdapter {
  // 初始化存储
  init(): Promise<void>

  // 保存数据
  save<T>(key: string, value: T): Promise<void>

  // 加载数据
  load<T>(key: string, defaultValue: T): Promise<T>

  // 删除数据
  remove(key: string): Promise<void>

  // 清空存储
  clear(): Promise<void>

  // 获取所有键
  keys(): Promise<string[]>
}

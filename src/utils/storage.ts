import { Store } from '@tauri-apps/plugin-store'

/**
 * 配置文件枚举
 *
 * 定义应用程序使用的配置文件名称
 */
export enum ConfigFile {
  Settings = '.settings.dat',
  EyeProtection = '.eye-protection.dat',
  Router = '.router.dat',
  MusicPlayer = '.music-player.dat',
  Download = '.download.dat',
  Canvas = '.canvas.dat'
}

// 存储Store实例的Map，用于缓存已加载的Store对象
const stores = new Map<string, Store>()

/**
 * 获取Store实例
 *
 * 该函数用于获取指定文件名的Store实例，如果实例不存在则创建新实例并缓存
 *
 * @param fileName - 配置文件名，默认为ConfigFile.Settings
 * @returns 返回对应的Store实例
 */
async function getStore(fileName: string = ConfigFile.Settings) {
  if (!stores.has(fileName)) {
    const store = await Store.load(fileName)
    stores.set(fileName, store)
  }
  return stores.get(fileName)!
}

/**
 * 从存储中加载数据
 *
 * 根据指定的键名从存储中加载数据，如果不存在则返回默认值
 *
 * @param key - 存储的键名
 * @param defaultValue - 默认值，当键名对应的数据不存在时返回
 * @param fileName - 配置文件名，可选参数
 * @returns 返回存储的数据或默认值
 */
export async function load<T>(key: string, defaultValue: T, fileName?: ConfigFile): Promise<T> {
  const store = await getStore(fileName)
  return (await store.get(key)) ?? defaultValue
}

/**
 * 保存数据到存储
 *
 * 将指定的键值对保存到存储中，并立即持久化
 *
 * @param key - 存储的键名
 * @param value - 要存储的值
 * @param fileName - 配置文件名，可选参数
 */
export async function save<T>(key: string, value: T, fileName?: ConfigFile): Promise<void> {
  const store = await getStore(fileName)
  await store.set(key, value)
  await store.save()
}

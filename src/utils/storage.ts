import { Store } from '@tauri-apps/plugin-store'

let store: Store | null = null

async function getStore() {
  if (!store) {
    store = await Store.load('.settings.dat')
  }
  return store
}

export async function load<T>(key: string, defaultValue: T): Promise<T> {
  const store = await getStore()
  return (await store.get(key)) ?? defaultValue
}

export async function save<T>(key: string, value: T): Promise<void> {
  const store = await getStore()
  await store.set(key, value)
  await store.save()
}

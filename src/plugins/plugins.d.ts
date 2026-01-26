import 'pinia'
import { PersistOptions } from './pinia-storage-adapter'
import { storage } from 'src/utils/sql/index'
import { StoreReadyState } from '@/types/pinia-store'

declare module 'pinia' {
  interface DefineStoreOptionsBase<S extends StateTree, Store> {
    persist?: PersistOptions
  }
  export interface PiniaCustomStateProperties {
    $ready?: StoreReadyState
  }
  export interface PiniaCustomProperties {
    // 存储实例
    $storage: typeof storage
  }
}

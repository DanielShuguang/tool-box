import 'pinia'
import { PersistOptions } from './pinia-storage-adapter'
import { StoreReadyState } from '@/types/pinia-store'

declare module 'pinia' {
  interface DefineStoreOptionsBase<S extends StateTree, Store> {
    persist?: PersistOptions
  }
  export interface PiniaCustomStateProperties {
    $ready?: StoreReadyState
  }
}

import 'pinia'
import { PersistOptions } from './pinia-storage-adapter'

declare module 'pinia' {
  interface DefineStoreOptionsBase<S extends StateTree, Store> {
    persist?: PersistOptions
  }
}

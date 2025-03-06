import { Emitter } from 'mitt'
import { GlobalEventMap } from './utils/event'

declare module 'vue' {
  export interface ComponentCustomProperties {
    $bus: Emitter<GlobalEventMap>
  }
}

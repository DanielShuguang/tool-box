import mitt, { Emitter } from 'mitt'

export type GlobalEventMap = {
  'theme-change': boolean
  'close-window': void
}

export const emitter = mitt<GlobalEventMap>()

export interface UseEmitterOptions<T extends Record<string, unknown>> {
  once?: boolean
  instance?: Emitter<T>
}

export function useEmitter<
  Events extends Record<string, unknown> = GlobalEventMap,
  Key extends keyof Events = keyof Events
>(event: Key, handler: (arg: Events[Key]) => void, options?: UseEmitterOptions<Events>) {
  const { instance = emitter, once } = options || {}

  const currentInstance = instance as Emitter<any>

  currentInstance.on(event, (...arg) => {
    handler(...arg)
    if (once) {
      off()
    }
  })

  function off() {
    currentInstance.off(event, handler)
  }

  onUnmounted(off)

  return off
}

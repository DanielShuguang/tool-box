import { Emitter } from 'mitt'

export interface UseEmitterOptions<
  TEvents extends Record<string, any>,
  TEventType extends keyof TEvents
> {
  once?: boolean
  event: TEventType
  handler: (arg: TEvents[TEventType]) => void
}

export function useEmitter<TEvents extends Record<string, any>, TEventType extends keyof TEvents>(
  instance: Emitter<TEvents>,
  options: UseEmitterOptions<TEvents, TEventType>
) {
  const { event, handler, once } = options || {}

  const currentInstance = instance as Emitter<any>

  currentInstance.on(event, arg => {
    handler(arg)
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

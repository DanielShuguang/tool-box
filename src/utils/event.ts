import mitt from 'mitt'

export type EventMap = {
  'theme-change': boolean
  'exit-app': void
}

export const emitter = mitt<EventMap>()

export function useEmitter<Event extends keyof EventMap>(
  event: Event,
  handler: (arg: EventMap[Event]) => void
) {
  emitter.on(event, handler)

  function off() {
    emitter.off(event, handler)
  }

  onUnmounted(off)

  return off
}

import { Nullable } from '@/types/common'
import { Event, listen, UnlistenFn } from '@tauri-apps/api/event'

export function useRuntimeEvent<T>(eventName: string, handler: (event: Event<T>) => void) {
  let unlisten: Nullable<UnlistenFn> = null

  function stop() {
    unlisten?.()
  }

  listen(eventName, handler).then(fn => {
    unlisten = fn
  })

  onScopeDispose(stop)

  return stop
}

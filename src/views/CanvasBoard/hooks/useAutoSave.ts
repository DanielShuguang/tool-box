/**
 * 自动保存 Hook
 *
 * 使用防抖方式在操作触发后自动保存
 */
import { useDebounceFn } from '@vueuse/core'

interface AutoSaveOptions {
  delay?: number
}

export function useAutoSave(options: AutoSaveOptions = {}) {
  const delay = options.delay ?? 1000

  let saveHandler: ((json: string) => void) | null = null

  const save = useDebounceFn((json: string) => {
    if (saveHandler) {
      saveHandler(json)
    }
  }, delay)

  const start = (handler: (json: string) => void) => {
    saveHandler = handler
  }

  const stop = () => {
    saveHandler = null
  }

  const trigger = (json: string) => {
    save(json)
  }

  const destroy = () => {
    stop()
  }

  return {
    start,
    stop,
    trigger,
    destroy
  }
}

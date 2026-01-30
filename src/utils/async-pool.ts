interface BaseOptions {
  max?: number
  mode?: 'race' | 'all'
}

export interface TotalPool<Resp> extends BaseOptions {
  total: number
  asyncFn: (index: number) => Promise<Resp>
}
export interface ListPool<Resp, Item> extends BaseOptions {
  list: Item[]
  asyncFn: (el: Item, index: number) => Promise<Resp>
}

function isTotalPoolOption<R>(arg: any): arg is TotalPool<R> {
  return 'total' in arg
}

/**
 * 并发控制函数
 * @param opts
 */
export async function asyncPool<Resp, Item>(opts: ListPool<Resp, Item>): Promise<Resp[]>
export async function asyncPool<Resp>(opts: TotalPool<Resp>): Promise<Resp[]>
export async function asyncPool<Resp, Item>(
  opts: TotalPool<Resp> | ListPool<Resp, Item>
): Promise<Resp[]> {
  const { max: rawMax = 5, mode = 'race' } = opts
  // 修复：当max小于等于0时应该使用默认值5
  const max = rawMax <= 0 ? 5 : rawMax
  let length = 0
  const isTotalOpt = isTotalPoolOption(opts)
  if (isTotalOpt) {
    const { total } = opts
    length = total
  } else {
    length = opts.list.length
  }

  // 处理边界情况：如果length为0，则直接返回空数组
  if (length === 0) {
    return []
  }

  const resps: Resp[] = []
  const runningTasks = new Map<number, Promise<void>>()

  for (let i = 0; i < length; i += 1) {
    if (runningTasks.size >= max) {
      if (mode === 'all') {
        // 等待所有任务完成
        await Promise.allSettled(runningTasks.values())
      } else {
        // 等待一个任务完成
        await Promise.race(runningTasks.values())
      }
    }

    const task = (async index => {
      const res = await (isTotalOpt ? opts.asyncFn(index) : opts.asyncFn(opts.list[index], index))
      resps[index] = res
      runningTasks.delete(index)
    })(i)

    runningTasks.set(i, task)
  }

  // 等待所有剩余任务完成
  await Promise.all(runningTasks.values())

  return resps
}

export interface TotalPool<Resp> {
  total: number
  asyncFn: (index: number) => Promise<Resp>
  max?: number
}
export interface ListPool<Resp, Item> {
  list: Item[]
  asyncFn: (el: Item, index: number) => Promise<Resp>
  max?: number
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
  const { max: rawMax = 5 } = opts
  const max = rawMax > 0 ? rawMax : 5
  let length = 0
  const isTotalOpt = isTotalPoolOption(opts)
  if (isTotalOpt) {
    const { total } = opts
    length = total
  } else {
    length = opts.list.length
  }

  const resps: Resp[] = []
  const runningTasks: Promise<void>[] = []

  for (let i = 0; i < length; i += 1) {
    if (runningTasks.length >= max) {
      // 等待一个任务完成
      await Promise.race(runningTasks)
    }

    const task = (async () => {
      const res = await (isTotalOpt ? opts.asyncFn(i) : opts.asyncFn(opts.list[i], i))
      resps.push(res)
    })()

    runningTasks.push(task)
  }

  // 等待所有剩余任务完成
  await Promise.all(runningTasks)

  return resps
}

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
  return 'list' in arg
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
  const { max = 5 } = opts
  let length = 0
  const isTotalOpt = isTotalPoolOption(opts)
  if (isTotalOpt) {
    const { total } = opts
    length = total
  } else {
    length = opts.list.length
  }

  const resps: Resp[] = []
  const fns: Array<() => Promise<any>> = []
  for (let i = 0; i < length; i++) {
    if (fns.length >= max) {
      await Promise.race(fns.map(fn => fn()))
    }
    const fn = async () => {
      const res = await (isTotalOpt ? opts.asyncFn(i) : opts.asyncFn(opts.list[i], i))
      resps.push(res)
      const index = fns.indexOf(fn)
      fns.splice(index, 1)
    }
    fns.push(fn)
  }

  await Promise.all(fns.map(fn => fn()))

  return resps
}

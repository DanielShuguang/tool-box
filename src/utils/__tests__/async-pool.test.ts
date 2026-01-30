import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { asyncPool, ListPool, TotalPool } from '../async-pool'

describe('asyncPool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ListPool 模式', () => {
    it('应该正确处理空列表', async () => {
      const opts: ListPool<string, string> = {
        list: [],
        asyncFn: async (item: string) => item
      }
      const result = await asyncPool(opts)

      expect(result).toEqual([])
    })

    it('应该按顺序返回结果', async () => {
      const items = ['a', 'b', 'c', 'd', 'e']
      const opts: ListPool<string, string> = {
        list: items,
        asyncFn: async (item: string) => item.toUpperCase()
      }
      const result = await asyncPool(opts)

      expect(result).toEqual(['A', 'B', 'C', 'D', 'E'])
    })

    it('应该支持索引参数', async () => {
      const items = ['first', 'second', 'third']
      const opts: ListPool<number, string> = {
        list: items,
        asyncFn: async (_item: string, index: number) => index
      }
      const result = await asyncPool(opts)

      expect(result).toEqual([0, 1, 2])
    })

    it('应该限制并发数量', async () => {
      const concurrency: number[] = []
      const opts: ListPool<number, number> = {
        max: 2,
        list: [1, 2, 3, 4],
        asyncFn: async (item: number) => {
          concurrency.push(item)
          await new Promise(resolve => setTimeout(resolve, 50))
          return item
        }
      }

      await asyncPool(opts)

      expect(concurrency.length).toBe(4)
    })

    it('应该处理异步错误', async () => {
      const opts: ListPool<number, number> = {
        list: [1, 2, 3],
        asyncFn: async (item: number) => {
          if (item === 2) {
            throw new Error('Test error')
          }
          return item
        }
      }

      await expect(asyncPool(opts)).rejects.toThrow('Test error')
    })
  })

  describe('TotalPool 模式', () => {
    it('应该正确处理总数为0', async () => {
      const opts: TotalPool<number> = {
        total: 0,
        asyncFn: async (index: number) => index
      }
      const result = await asyncPool(opts)

      expect(result).toEqual([])
    })

    it('应该按顺序返回结果', async () => {
      const opts: TotalPool<number> = {
        total: 5,
        asyncFn: async (index: number) => index * 2
      }
      const result = await asyncPool(opts)

      expect(result).toEqual([0, 2, 4, 6, 8])
    })

    it('应该限制并发数量', async () => {
      const activeCount: number[] = []
      let maxConcurrent = 0

      const opts: TotalPool<number> = {
        max: 3,
        total: 10,
        asyncFn: async (index: number) => {
          activeCount.push(index)
          maxConcurrent = Math.max(maxConcurrent, activeCount.length)
          await new Promise(resolve => setTimeout(resolve, 10))
          activeCount.shift()
          return index
        }
      }

      await asyncPool(opts)

      expect(maxConcurrent).toBeLessThanOrEqual(3)
    })
  })

  describe('mode 配置', () => {
    it('race 模式应该一个任务完成就继续', async () => {
      const executionOrder: number[] = []

      const promises = [
        new Promise<number>(resolve =>
          setTimeout(() => {
            executionOrder.push(1)
            resolve(1)
          }, 100)
        ),
        new Promise<number>(resolve =>
          setTimeout(() => {
            executionOrder.push(2)
            resolve(2)
          }, 50)
        ),
        new Promise<number>(resolve =>
          setTimeout(() => {
            executionOrder.push(3)
            resolve(3)
          }, 150)
        )
      ]

      const start = Date.now()
      await Promise.all(promises)
      const elapsed = Date.now() - start

      expect(executionOrder).toEqual([2, 1, 3])
      expect(elapsed).toBeLessThan(200)
    })

    it('all 模式应该等待所有任务完成', async () => {
      const start = Date.now()

      const opts: ListPool<number, number> = {
        mode: 'all',
        max: 2,
        list: [1, 2, 3, 4],
        asyncFn: async (item: number) => {
          await new Promise(resolve => setTimeout(resolve, 50))
          return item
        }
      }

      await asyncPool(opts)

      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(100)
    })
  })

  describe('max 配置边界', () => {
    it('max 为 0 时应该使用默认值 5', async () => {
      const opts: ListPool<number, number> = {
        max: 0,
        list: [1, 2, 3],
        asyncFn: async (item: number) => item
      }
      const result = await asyncPool(opts)

      expect(result).toEqual([1, 2, 3])
    })

    it('max 为负数时应该使用默认值 5', async () => {
      const opts: ListPool<number, number> = {
        max: -1,
        list: [1, 2, 3],
        asyncFn: async (item: number) => item
      }
      const result = await asyncPool(opts)

      expect(result).toEqual([1, 2, 3])
    })

    it('max 大于列表长度时应该使用列表长度', async () => {
      const opts: ListPool<number, number> = {
        max: 100,
        list: [1, 2, 3],
        asyncFn: async (item: number) => item
      }
      const result = await asyncPool(opts)

      expect(result).toEqual([1, 2, 3])
    })
  })
})

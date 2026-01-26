import { createStorageAdapter } from 'src/utils/sql'

// 记账记录接口
export interface AccountingRecord {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: number
  note?: string
}

// 记账记录过滤条件
export interface AccountingFilter {
  type?: 'income' | 'expense'
  category?: string
  startDate?: number
  endDate?: number
}

// 记账记录查询结果
export interface AccountingQueryResult {
  records: AccountingRecord[]
  total: number
}

// 记账统计结果
export interface AccountingStats {
  income: number
  expense: number
  balance: number
}

// 记账记录存储键前缀
const RECORD_KEY_PREFIX = 'accounting_record_'
const RECORDS_INDEX_KEY = 'accounting_records_index'

// 记录索引接口
interface RecordsIndex {
  ids: string[]
  count: number
}

// 创建记账记录存储服务
const storage = createStorageAdapter('accounting')

// 记账存储服务
export const accountingStorage = {
  // 初始化存储
  async init(): Promise<void> {
    await storage.init()
  },

  // 添加记账记录
  async addAccountingRecord(record: Omit<AccountingRecord, 'id'>): Promise<string> {
    const id = crypto.randomUUID()
    const newRecord: AccountingRecord = { id, ...record }

    // 保存记录
    await storage.save(`${RECORD_KEY_PREFIX}${id}`, newRecord)

    // 更新索引
    const index = await storage.load<RecordsIndex>(RECORDS_INDEX_KEY, { ids: [], count: 0 })
    index.ids.unshift(id)
    index.count += 1
    await storage.save(RECORDS_INDEX_KEY, index)

    return id
  },

  // 删除记账记录
  async deleteAccountingRecord(id: string): Promise<void> {
    // 删除记录
    await storage.remove(`${RECORD_KEY_PREFIX}${id}`)

    // 更新索引
    const index = await storage.load<RecordsIndex>(RECORDS_INDEX_KEY, { ids: [], count: 0 })
    const indexToRemove = index.ids.indexOf(id)
    if (indexToRemove !== -1) {
      index.ids.splice(indexToRemove, 1)
      index.count -= 1
      await storage.save(RECORDS_INDEX_KEY, index)
    }
  },

  // 更新记账记录
  async updateAccountingRecord(id: string, updates: Partial<AccountingRecord>): Promise<void> {
    const record = await storage.load<AccountingRecord | null>(`${RECORD_KEY_PREFIX}${id}`, null)
    if (record) {
      const updatedRecord = { ...record, ...updates }
      await storage.save(`${RECORD_KEY_PREFIX}${id}`, updatedRecord)
    }
  },

  // 分页查询记账记录
  async getAccountingRecords(
    page: number = 1,
    pageSize: number = 20,
    filters?: AccountingFilter
  ): Promise<AccountingQueryResult> {
    // 获取索引
    const index = await storage.load<RecordsIndex>(RECORDS_INDEX_KEY, { ids: [], count: 0 })

    // 获取所有记录
    const allRecords: AccountingRecord[] = []
    for (const id of index.ids) {
      const record = await storage.load<AccountingRecord | null>(`${RECORD_KEY_PREFIX}${id}`, null)
      if (record) {
        allRecords.push(record)
      }
    }

    // 应用过滤条件
    let filteredRecords = allRecords
    if (filters) {
      if (filters.type) {
        filteredRecords = filteredRecords.filter(record => record.type === filters.type)
      }
      if (filters.category) {
        filteredRecords = filteredRecords.filter(record => record.category === filters.category)
      }
      if (filters.startDate !== undefined) {
        filteredRecords = filteredRecords.filter(record => record.date >= (filters.startDate || 0))
      }
      if (filters.endDate !== undefined) {
        filteredRecords = filteredRecords.filter(record => record.date <= (filters.endDate || 0))
      }
    }

    // 按日期倒序排序
    filteredRecords.sort((a, b) => b.date - a.date)

    // 分页
    const total = filteredRecords.length
    const offset = (page - 1) * pageSize
    const records = filteredRecords.slice(offset, offset + pageSize)

    return {
      records,
      total
    }
  },

  // 获取记账记录详情
  async getAccountingRecord(id: string): Promise<AccountingRecord | undefined> {
    return await storage.load<AccountingRecord | undefined>(`${RECORD_KEY_PREFIX}${id}`, undefined)
  },

  // 统计记账数据
  async getAccountingStats(filters?: {
    startDate?: number
    endDate?: number
  }): Promise<AccountingStats> {
    // 获取索引
    const index = await storage.load<RecordsIndex>(RECORDS_INDEX_KEY, { ids: [], count: 0 })

    // 获取所有记录
    const allRecords: AccountingRecord[] = []
    for (const id of index.ids) {
      const record = await storage.load<AccountingRecord | null>(`${RECORD_KEY_PREFIX}${id}`, null)
      if (record) {
        allRecords.push(record)
      }
    }

    // 应用过滤条件
    let records = allRecords
    if (filters) {
      if (filters.startDate !== undefined) {
        records = records.filter(record => record.date >= (filters.startDate || 0))
      }
      if (filters.endDate !== undefined) {
        records = records.filter(record => record.date <= (filters.endDate || 0))
      }
    }

    const income = records
      .filter(record => record.type === 'income')
      .reduce((sum, record) => sum + record.amount, 0)
    const expense = records
      .filter(record => record.type === 'expense')
      .reduce((sum, record) => sum + record.amount, 0)

    return {
      income,
      expense,
      balance: income - expense
    }
  }
}

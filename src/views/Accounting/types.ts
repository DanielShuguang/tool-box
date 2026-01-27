export type AccountingRecordType = 'income' | 'expense'

export type AccountSelectType = AccountingRecordType | 'all'

// 记账记录接口
export interface AccountingRecord {
  id: string
  amount: number
  type: AccountingRecordType
  category: string
  date: number
  note?: string
}

// 记账记录过滤条件
export interface AccountingFilter {
  type?: AccountingRecordType
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

export type NewAccountingRecord = Omit<AccountingRecord, 'id'>

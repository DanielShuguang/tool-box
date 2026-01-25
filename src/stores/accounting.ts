import { ConfigFile } from '@/utils/storage'

// 分类接口
export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  icon?: string
}

// 记账记录接口
export interface AccountingRecord {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: number
  note?: string
}

// 新记录接口（用于添加记录）
export interface NewAccountingRecord {
  amount: number
  type: 'income' | 'expense'
  category: string
  date: number
  note?: string
}

export const useAccountingStore = defineStore(
  'accounting',
  () => {
    // 内置分类列表
    const defaultCategories: Category[] = [
      // 收入分类
      { id: 'income-salary', name: '工资', type: 'income' },
      { id: 'income-bonus', name: '奖金', type: 'income' },
      { id: 'income-investment', name: '投资收益', type: 'income' },
      { id: 'income-other', name: '其他收入', type: 'income' },

      // 支出分类
      { id: 'expense-food', name: '餐饮', type: 'expense' },
      { id: 'expense-transport', name: '交通', type: 'expense' },
      { id: 'expense-shopping', name: '购物', type: 'expense' },
      { id: 'expense-entertainment', name: '娱乐', type: 'expense' },
      { id: 'expense-housing', name: '住房', type: 'expense' },
      { id: 'expense-utilities', name: '水电', type: 'expense' },
      { id: 'expense-education', name: '教育', type: 'expense' },
      { id: 'expense-medical', name: '医疗', type: 'expense' },
      { id: 'expense-other', name: '其他支出', type: 'expense' }
    ]

    // 分类列表
    const categories = ref<Category[]>(defaultCategories)

    // 记账记录列表
    const records = ref<AccountingRecord[]>([])

    // 按时间倒序排列的记录
    const sortedRecords = computed(() => {
      return [...records.value].sort((a, b) => b.date - a.date)
    })

    // 添加记录
    const addRecord = (record: NewAccountingRecord) => {
      const newRecord: AccountingRecord = {
        id: crypto.randomUUID(), // 生成唯一ID
        ...record
      }
      records.value.push(newRecord)
    }

    // 删除记录
    const deleteRecord = (id: string) => {
      const index = records.value.findIndex(record => record.id === id)
      if (index !== -1) {
        records.value.splice(index, 1)
      }
    }

    // 添加分类
    const addCategory = (category: Omit<Category, 'id'>) => {
      const newCategory: Category = {
        id: `${category.type}-${crypto.randomUUID().slice(0, 8)}`,
        ...category
      }
      categories.value.push(newCategory)
    }

    // 删除分类
    const deleteCategory = (id: string) => {
      const index = categories.value.findIndex(category => category.id === id)
      if (index !== -1) {
        categories.value.splice(index, 1)
      }
    }

    return {
      categories,
      records: sortedRecords,
      addRecord,
      deleteRecord,
      addCategory,
      deleteCategory
    }
  },
  {
    // 配置持久化
    persist: {
      fileName: ConfigFile.Settings,
      key: 'accounting'
    }
  }
)

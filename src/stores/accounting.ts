import { ConfigFile } from '@/utils/storage'
import { accountingStorage, AccountingFilter } from '@/views/Accounting/storage'

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

    // 当前页面的记账记录
    const currentRecords = ref<AccountingRecord[]>([])
    // 总记录数
    const totalRecords = ref(0)
    // 当前页码
    const currentPage = ref(1)
    // 每页大小
    const pageSize = ref(20)
    // 加载状态
    const loading = ref(false)
    // 当前过滤条件
    const currentFilters = ref<AccountingFilter>({})

    // 添加记录
    const addRecord = async (record: NewAccountingRecord) => {
      try {
        loading.value = true
        await accountingStorage.addAccountingRecord(record)
        // 添加成功后重新加载当前页
        await loadRecords(currentPage.value, pageSize.value, currentFilters.value)
      } catch (error) {
        console.error('Failed to add record:', error)
        throw error
      } finally {
        loading.value = false
      }
    }

    // 删除记录
    const deleteRecord = async (id: string) => {
      try {
        loading.value = true
        await accountingStorage.deleteAccountingRecord(id)
        // 删除成功后重新加载当前页
        await loadRecords(currentPage.value, pageSize.value, currentFilters.value)
      } catch (error) {
        console.error('Failed to delete record:', error)
        throw error
      } finally {
        loading.value = false
      }
    }

    // 更新记录
    const updateRecord = async (id: string, updates: Partial<AccountingRecord>) => {
      try {
        loading.value = true
        await accountingStorage.updateAccountingRecord(id, updates)
        // 更新成功后重新加载当前页
        await loadRecords(currentPage.value, pageSize.value, currentFilters.value)
      } catch (error) {
        console.error('Failed to update record:', error)
        throw error
      } finally {
        loading.value = false
      }
    }

    // 加载记录
    const loadRecords = async (page: number, size: number, filters?: AccountingFilter) => {
      try {
        loading.value = true
        const result = await accountingStorage.getAccountingRecords(page, size, filters)
        currentRecords.value = result.records
        totalRecords.value = result.total
        currentPage.value = page
        pageSize.value = size
        if (filters) {
          currentFilters.value = filters
        }
      } catch (error) {
        console.error('Failed to load records:', error)
        throw error
      } finally {
        loading.value = false
      }
    }

    // 加载下一页
    const loadNextPage = async () => {
      const nextPage = currentPage.value + 1
      await loadRecords(nextPage, pageSize.value, currentFilters.value)
    }

    // 加载上一页
    const loadPreviousPage = async () => {
      if (currentPage.value > 1) {
        const previousPage = currentPage.value - 1
        await loadRecords(previousPage, pageSize.value, currentFilters.value)
      }
    }

    // 加载第一页
    const loadFirstPage = async () => {
      await loadRecords(1, pageSize.value, currentFilters.value)
    }

    // 应用过滤条件
    const applyFilters = async (filters: AccountingFilter) => {
      await loadRecords(1, pageSize.value, filters)
    }

    // 清除过滤条件
    const clearFilters = async () => {
      await loadRecords(1, pageSize.value, {})
    }

    // 获取记录详情
    const getRecordById = async (id: string) => {
      try {
        return await accountingStorage.getAccountingRecord(id)
      } catch (error) {
        console.error('Failed to get record:', error)
        throw error
      }
    }

    // 获取统计数据
    const getStats = async (filters?: AccountingFilter) => {
      try {
        return await accountingStorage.getAccountingStats(filters)
      } catch (error) {
        console.error('Failed to get stats:', error)
        throw error
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

    // 初始化加载第一页数据
    loadRecords(1, pageSize.value)

    return {
      categories,
      records: currentRecords,
      totalRecords,
      currentPage,
      pageSize,
      loading,
      currentFilters,
      addRecord,
      deleteRecord,
      updateRecord,
      loadRecords,
      loadNextPage,
      loadPreviousPage,
      loadFirstPage,
      applyFilters,
      clearFilters,
      getRecordById,
      getStats,
      addCategory,
      deleteCategory
    }
  },
  {
    // 配置持久化（只持久化分类，记录使用IndexedDB存储）
    persist: {
      fileName: ConfigFile.Settings,
      key: 'accounting',
      keys: ['categories']
    }
  }
)

import { useAccountingStore } from '@/stores/accounting'

// 导出记账页面逻辑
export function useAccountingLogic() {
  const accountingStore = useAccountingStore()

  // 获取所有分类
  const categories = computed(() => accountingStore.categories)

  // 获取所有记录
  const records = computed(() => accountingStore.records)

  // 筛选类型
  const filterType = ref<'all' | 'income' | 'expense'>('all')

  // 过滤后的记录
  const filteredRecords = computed(() => {
    if (filterType.value === 'all') {
      return records.value
    }
    return records.value.filter(record => record.type === filterType.value)
  })

  // 设置筛选类型
  const setFilterType = (type: 'all' | 'income' | 'expense') => {
    filterType.value = type
  }

  // 本月收入
  const totalIncome = computed(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return records.value
      .filter(record => {
        const recordDate = new Date(record.date)
        return (
          record.type === 'income' &&
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear
        )
      })
      .reduce((sum, record) => sum + record.amount, 0)
  })

  // 本月支出
  const totalExpense = computed(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return records.value
      .filter(record => {
        const recordDate = new Date(record.date)
        return (
          record.type === 'expense' &&
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear
        )
      })
      .reduce((sum, record) => sum + record.amount, 0)
  })

  // 表单数据
  const recordForm = reactive({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: new Date().getTime(),
    note: ''
  })

  // 添加记录
  const addRecord = () => {
    // 转换金额为数字
    const amount = parseFloat(recordForm.amount)

    // 验证表单
    if (isNaN(amount) || amount <= 0) {
      return
    }

    if (!recordForm.category) {
      return
    }

    // 调用store添加记录
    accountingStore.addRecord({
      amount,
      type: recordForm.type,
      category: recordForm.category,
      date: recordForm.date,
      note: recordForm.note
    })

    // 重置表单
    recordForm.amount = ''
    recordForm.type = 'expense'
    recordForm.category = ''
    recordForm.date = new Date().getTime()
    recordForm.note = ''
  }

  // 删除记录
  const deleteRecord = (id: string) => {
    accountingStore.deleteRecord(id)
  }

  // 根据ID获取分类名称
  const getCategoryName = (categoryId: string, type: 'income' | 'expense') => {
    const category = categories.value.find(cat => cat.id === categoryId && cat.type === type)
    return category?.name || '未分类'
  }

  return {
    // 表单相关
    recordForm,
    addRecord,

    // 分类相关
    categories,
    getCategoryName,

    // 记录相关
    records,
    filterType,
    setFilterType,
    filteredRecords,
    deleteRecord,

    // 统计相关
    totalIncome,
    totalExpense
  }
}

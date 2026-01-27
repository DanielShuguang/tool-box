import { useAccountingStore } from '@/stores/accounting'
import { AccountingRecordType, AccountSelectType, NewAccountingRecord } from './types'

// 导出记账页面逻辑
export function useAccountingLogic() {
  const accountingStore = useAccountingStore()
  const dialog = useDialog()
  const { categories, records, totalRecords, currentPage, pageSize, loading } =
    storeToRefs(accountingStore)

  // 筛选类型
  const filterType = ref<AccountSelectType>('all')

  // 设置筛选类型
  const setFilterType = async (type: AccountSelectType) => {
    filterType.value = type
    // 应用筛选条件
    if (type === 'all') {
      await accountingStore.applyFilters({})
    } else {
      await accountingStore.applyFilters({ type })
    }
  }

  // 表单数据
  const recordForm = reactive<NewAccountingRecord>({
    amount: 0,
    type: 'expense',
    category: '',
    date: new Date().getTime(),
    note: ''
  })

  // 添加记录
  const addRecord = async () => {
    // 转换金额为数字
    const amount = recordForm.amount

    // 验证表单
    if (isNaN(amount) || amount <= 0) {
      return
    }

    if (!recordForm.category) {
      return
    }

    // 调用store添加记录
    await accountingStore.addRecord({
      amount,
      type: recordForm.type,
      category: recordForm.category,
      date: recordForm.date,
      note: recordForm.note
    })

    // 重置表单
    recordForm.amount = 0
    recordForm.type = 'expense'
    recordForm.category = ''
    recordForm.date = new Date().getTime()
    recordForm.note = ''
  }

  // 删除记录
  const deleteRecord = (id: string) => {
    // 显示确认对话框
    dialog.warning({
      title: '确认删除',
      content: '确定要删除这条记录吗？此操作不可撤销。',
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        await accountingStore.deleteRecord(id)
      }
    })
  }

  // 页面变化处理
  const handlePageChange = async (page: number) => {
    await accountingStore.loadRecords(page, pageSize.value)
  }

  // 每页大小变化处理
  const handlePageSizeChange = async (size: number) => {
    await accountingStore.loadRecords(1, size)
  }

  // 根据ID获取分类名称
  const getCategoryName = (categoryId: string, type: AccountingRecordType) => {
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
    totalRecords,
    currentPage,
    pageSize,
    loading,
    filterType,
    setFilterType,
    deleteRecord,
    handlePageChange,
    handlePageSizeChange
  }
}

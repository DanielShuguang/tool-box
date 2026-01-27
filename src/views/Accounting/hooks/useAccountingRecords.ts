import { useAccountingStore } from '@/stores/accounting'
import { AccountSelectType } from '../types'
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDialog } from 'naive-ui'

// 记录相关逻辑
export function useAccountingRecords() {
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
  const getCategoryName = (categoryId: string, type: 'income' | 'expense') => {
    const category = categories.value.find((cat: any) => cat.id === categoryId && cat.type === type)
    return category?.name || '未分类'
  }

  return {
    // 状态
    categories,
    records,
    totalRecords,
    currentPage,
    pageSize,
    loading,
    filterType,

    // 方法
    setFilterType,
    deleteRecord,
    handlePageChange,
    handlePageSizeChange,
    getCategoryName
  }
}

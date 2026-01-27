import { useAccountingStore } from '@/stores/accounting'
import { NewAccountingRecord } from '../types'
import { reactive } from 'vue'

// 表单相关逻辑
export function useAccountingForm() {
  const accountingStore = useAccountingStore()

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

  return {
    recordForm,
    addRecord
  }
}

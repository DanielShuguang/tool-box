<script setup lang="tsx">
import { DataTableColumn } from 'naive-ui'
import { AccountingRecord, AccountingStats } from './types'
import { useAccountingForm } from './hooks/useAccountingForm'
import { useAccountingRecords } from './hooks/useAccountingRecords'
import { useAccountingImportExport } from './hooks/useAccountingImportExport'
import { useAccountingStore } from '@/stores/accounting'

// 商店和统计
const accountingStore = useAccountingStore()

// 获取统计数据
const stats = ref<AccountingStats>({ income: 0, expense: 0, balance: 0 })
const loadStats = async () => {
  stats.value = await accountingStore.getStats()
}
loadStats()

// 表单相关逻辑
const { recordForm, addRecord } = useAccountingForm()

// 记录相关逻辑
const {
  categories,
  records,
  totalRecords,
  currentPage,
  pageSize,
  loading,
  filterType,
  setFilterType,
  deleteRecord,
  handlePageChange,
  handlePageSizeChange,
  getCategoryName
} = useAccountingRecords()

// 导入导出相关逻辑
const { exportData, importData } = useAccountingImportExport()

// 表格列配置
const tableColumns: DataTableColumn<AccountingRecord>[] = [
  {
    title: '日期',
    key: 'date',
    width: 120,
    render: row => new Date(row.date).toLocaleDateString('zh-CN')
  },
  {
    title: '类型',
    key: 'type',
    width: 90,
    render: row => (
      <NTag type={row.type === 'income' ? 'success' : 'error'} size="small" bordered={false}>
        {row.type === 'income' ? '收入' : '支出'}
      </NTag>
    )
  },
  {
    title: '分类',
    key: 'category',
    width: 120,
    render: row => (
      <span class="text-gray-700 dark:text-gray-300">{getCategoryName(row.category, row.type)}</span>
    )
  },
  {
    title: '金额',
    key: 'amount',
    width: 140,
    render: row => (
      <span class={row.type === 'income' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
        {row.type === 'income' ? '+' : '-'}
        ¥{row.amount.toFixed(2)}
      </span>
    )
  },
  {
    title: '备注',
    key: 'note',
    ellipsis: { tooltip: true },
    render: row => row.note || <span class="text-gray-400">-</span>
  },
  {
    title: '',
    key: 'action',
    width: 80,
    render: row => (
      <NButton type="error" size="small" quaternary onClick={() => deleteRecord(row.id)}>
        删除
      </NButton>
    )
  }
]

// 表单相关状态
const showForm = ref(true)

// 切换表单显示
const toggleForm = () => {
  showForm.value = !showForm.value
}

// 添加记录后刷新统计
const handleAddRecord = async () => {
  await addRecord()
  await loadStats()
}

// 格式化金额
const formatMoney = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div
    class="w-full p-4 md:p-6 min-h-screen pb-20"
    style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">记账管理</h1>
      <p class="text-gray-500 mt-1">记录您的每一笔收支</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
      <!-- 收入卡片 -->
      <div
        class="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 mb-1">总收入</p>
            <p class="text-2xl font-bold text-emerald-600">+¥{{ formatMoney(stats.income) }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg
              class="w-6 h-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 支出卡片 -->
      <div
        class="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 mb-1">总支出</p>
            <p class="text-2xl font-bold text-rose-600">-¥{{ formatMoney(stats.expense) }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
            <svg
              class="w-6 h-6 text-rose-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 余额卡片 -->
      <div
        class="bg-white rounded-2xl p-5 shadow-sm border border-violet-100 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 mb-1">账户余额</p>
            <p
              class="text-2xl font-bold"
              :class="stats.balance >= 0 ? 'text-violet-600' : 'text-rose-600'">
              {{ stats.balance >= 0 ? '+' : '' }}¥{{ formatMoney(stats.balance) }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
            <svg
              class="w-6 h-6 text-violet-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 收支记录表单 -->
    <n-card v-if="showForm" class="mb-6" :bordered="false" shadow="small">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <svg
                class="w-4 h-4 text-violet-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">添加记录</h2>
          </div>
          <n-button quaternary size="small" @click="toggleForm">
            收起
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7" />
              </svg>
            </template>
          </n-button>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 金额输入 -->
        <div class="lg:col-span-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >金额</label
          >
          <n-input-number
            v-model:value="recordForm.amount"
            placeholder="0.00"
            :min="0"
            :precision="2"
            class="w-full">
            <template #prefix>¥</template>
          </n-input-number>
        </div>

        <!-- 收支类型选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >类型</label
          >
          <n-radio-group v-model:value="recordForm.type" class="w-full">
            <n-space vertical>
              <n-radio value="income" key="income">收入</n-radio>
              <n-radio value="expense" key="expense">支出</n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <!-- 分类选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >分类</label
          >
          <n-select
            v-model:value="recordForm.category"
            placeholder="请选择分类"
            :options="categories.filter(cat => cat.type === recordForm.type)"
            label-field="name"
            value-field="id"
            class="w-full" />
        </div>

        <!-- 日期选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >日期</label
          >
          <n-date-picker v-model:value="recordForm.date" type="date" class="w-full" />
        </div>
      </div>

      <!-- 备注输入 -->
      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >备注</label
        >
        <n-input
          v-model:value="recordForm.note"
          type="textarea"
          placeholder="添加备注信息（可选）"
          :autosize="{ minRows: 2, maxRows: 3 }" />
      </div>

      <!-- 提交按钮 -->
      <div class="mt-4 flex justify-end">
        <n-button type="primary" size="large" @click="handleAddRecord" attr-type="submit">
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4" />
            </svg>
          </template>
          添加记录
        </n-button>
      </div>
    </n-card>

    <!-- 展开表单按钮 -->
    <div v-else class="mb-6">
      <n-button type="primary" size="large" @click="toggleForm" block>
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4" />
          </svg>
        </template>
        添加收支记录
      </n-button>
    </div>

    <!-- 收支记录表格 -->
    <n-card :bordered="false" shadow="small" class="mb-6">
      <template #header>
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <svg
                class="w-4 h-4 text-violet-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">收支记录</h2>
            <n-tag size="small" round>{{ totalRecords }}</n-tag>
          </div>

          <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <!-- 筛选器 -->
            <n-radio-group v-model:value="filterType" @update:value="setFilterType" size="small">
              <n-space>
                <n-radio value="all">全部</n-radio>
                <n-radio value="income">收入</n-radio>
                <n-radio value="expense">支出</n-radio>
              </n-space>
            </n-radio-group>

            <!-- 导入导出按钮 -->
            <n-space size="small">
              <n-button type="default" size="small" @click="exportData('json')">
                导出 JSON
              </n-button>
              <n-button type="default" size="small" @click="exportData('xlsx')">
                导出 XLSX
              </n-button>
              <n-button type="default" size="small" @click="importData"> 导入 </n-button>
            </n-space>
          </div>
        </div>
      </template>

      <!-- 记录表格 -->
      <n-data-table
        :columns="tableColumns"
        :data="records"
        :loading="loading"
        :bordered="false"
        :single-line="false"
        striped />

      <!-- 分页 -->
      <div class="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
        <div class="text-sm text-gray-500 order-2 sm:order-1">共 {{ totalRecords }} 条记录</div>
        <n-pagination
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :item-count="totalRecords"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
          size="small"
          class="order-1 sm:order-2" />
      </div>
    </n-card>
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
:deep(::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:deep(::-webkit-scrollbar-track) {
  background: #f1f1f1;
  border-radius: 3px;
}

:deep(::-webkit-scrollbar-thumb) {
  background: #c4b5fd;
  border-radius: 3px;
}

:deep(::-webkit-scrollbar-thumb:hover) {
  background: #a78bfa;
}
</style>

<script setup lang="tsx">
import { NTag, NButton, DataTableColumn } from 'naive-ui'
import { AccountingRecord } from './types'
import { useAccountingForm } from './hooks/useAccountingForm'
import { useAccountingRecords } from './hooks/useAccountingRecords'
import { useAccountingImportExport } from './hooks/useAccountingImportExport'

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
    title: '类型',
    key: 'type',
    render: row => (
      <NTag type={row.type === 'income' ? 'success' : 'error'}>
        {row.type === 'income' ? '收入' : '支出'}
      </NTag>
    )
  },
  {
    title: '分类',
    key: 'category',
    render: row => getCategoryName(row.category, row.type)
  },
  {
    title: '金额',
    key: 'amount',
    render: row => (
      <span class={row.type === 'income' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
        {row.type === 'income' ? '+' : '-'}
        {'¥'}
        {row.amount.toFixed(2)}
      </span>
    )
  },
  {
    title: '日期',
    key: 'date',
    render: row => new Date(row.date).toLocaleDateString('zh-CN')
  },
  {
    title: '备注',
    key: 'note',
    ellipsis: true,
    render: row => row.note || '-'
  },
  {
    title: '操作',
    key: 'action',
    render: row => (
      <NButton type="error" quaternary onClick={() => deleteRecord(row.id)}>
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
</script>

<template>
  <div class="w-full p-4">
    <!-- 页面标题 -->
    <h1 class="text-2xl font-bold mb-6">记账工具</h1>

    <!-- 收支记录表单 -->
    <n-card v-if="showForm" class="mb-6">
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">添加收支记录</h2>
          <n-button quaternary @click="toggleForm">收起</n-button>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 金额输入 -->
        <div>
          <n-input-number v-model:value="recordForm.amount" placeholder="请输入金额" prefix="¥" />
        </div>

        <!-- 收支类型选择 -->
        <div>
          <n-radio-group v-model:value="recordForm.type">
            <n-space>
              <n-radio value="income">收入</n-radio>
              <n-radio value="expense">支出</n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <!-- 分类选择 -->
        <div>
          <n-select
            v-model:value="recordForm.category"
            placeholder="请选择分类"
            :options="categories.filter(cat => cat.type === recordForm.type)"
            label-field="name"
            value-field="id" />
        </div>

        <!-- 日期选择 -->
        <div>
          <n-date-picker v-model:value="recordForm.date" type="date" placeholder="请选择日期" />
        </div>

        <!-- 备注输入 -->
        <div class="md:col-span-2">
          <n-input
            v-model:value="recordForm.note"
            type="textarea"
            placeholder="请输入备注（可选）"
            :autosize="{ minRows: 2, maxRows: 4 }" />
        </div>

        <!-- 提交按钮 -->
        <div class="md:col-span-2 flex justify-end">
          <n-button type="primary" @click="addRecord">添加记录</n-button>
        </div>
      </div>
    </n-card>

    <!-- 展开表单按钮 -->
    <n-card v-else class="mb-6">
      <div class="flex justify-center">
        <n-button type="primary" @click="toggleForm">添加收支记录</n-button>
      </div>
    </n-card>

    <!-- 收支记录表格 -->
    <n-card>
      <template #header>
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 class="text-lg font-semibold">收支记录</h2>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <!-- 筛选器 -->
            <n-radio-group v-model:value="filterType" @update:value="setFilterType" class="mr-4">
              <n-space>
                <n-radio value="all">全部</n-radio>
                <n-radio value="income">收入</n-radio>
                <n-radio value="expense">支出</n-radio>
              </n-space>
            </n-radio-group>

            <!-- 导入导出按钮 -->
            <n-space>
              <n-button type="info" @click="exportData('json')">导出 JSON</n-button>
              <n-button type="info" @click="exportData('xlsx')">导出 XLSX</n-button>
              <n-button type="primary" @click="importData">导入数据</n-button>
            </n-space>
          </div>
        </div>
      </template>

      <!-- 记录表格 -->
      <div class="overflow-x-auto">
        <n-data-table :columns="tableColumns" :data="records" :loading="loading" bordered />
      </div>

      <!-- 分页 -->
      <div class="flex justify-between items-center mt-4">
        <div class="text-sm text-gray-500">共 {{ totalRecords }} 条记录</div>
        <n-pagination
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          :page-size-options="[10, 20, 50]"
          :item-count="totalRecords"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange" />
      </div>
    </n-card>
  </div>
</template>

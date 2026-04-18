<script setup lang="tsx">
import { DataTableColumn } from 'naive-ui'
import { AccountingRecord } from './types'
import { useAccountingForm } from './hooks/useAccountingForm'
import { useAccountingRecords } from './hooks/useAccountingRecords'
import { useAccountingImportExport } from './hooks/useAccountingImportExport'
import {
  AddOutline,
  DownloadOutline,
  CloudUploadOutline,
  ChevronDownOutline,
  ChevronUpOutline
} from '@vicons/ionicons5'
import { storeToRefs } from 'pinia'
import { useAccountingStore } from '@/stores/accounting'

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

// Store for stats
const store = useAccountingStore()
const { totalIncome, totalExpense, balance } = storeToRefs(store)

// 表单相关状态
const showForm = ref(true)

// 切换表单显示
const toggleForm = () => {
  showForm.value = !showForm.value
}

// 表格列配置
const tableColumns: DataTableColumn<AccountingRecord>[] = [
  {
    title: '类型',
    key: 'type',
    width: 80,
    render: row => (
      <NTag type={row.type === 'income' ? 'success' : 'error'} size="small">
        {row.type === 'income' ? '收入' : '支出'}
      </NTag>
    )
  },
  {
    title: '分类',
    key: 'category',
    width: 100,
    render: row => getCategoryName(row.category, row.type)
  },
  {
    title: '金额',
    key: 'amount',
    width: 120,
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
    width: 120,
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
    width: 80,
    render: row => (
      <NButton type="error" quaternary size="small" onClick={() => deleteRecord(row.id)} />
    )
  }
]
</script>

<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <!-- 页面标题 -->
    <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0">
      <h2 class="text-lg font-semibold">记账工具</h2>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 overflow-auto p-4">
      <!-- 统计卡片 -->
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div class="text-sm text-gray-500 mb-1">总收入</div>
          <div class="text-2xl font-bold text-green-500">+¥{{ totalIncome.toFixed(2) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div class="text-sm text-gray-500 mb-1">总支出</div>
          <div class="text-2xl font-bold text-red-500">-¥{{ totalExpense.toFixed(2) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div class="text-sm text-gray-500 mb-1">结余</div>
          <div class="text-2xl font-bold" :class="balance >= 0 ? 'text-green-500' : 'text-red-500'">
            {{ balance >= 0 ? '+' : '' }}¥{{ balance.toFixed(2) }}
          </div>
        </div>
      </div>

      <!-- 添加记录表单 -->
      <n-card class="mb-4" :bordered="false">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="text-base font-medium">添加记录</span>
            <n-button quaternary size="small" @click="toggleForm">
              <template #icon>
                <n-icon>
                  <ChevronUpOutline v-if="showForm" />
                  <ChevronDownOutline v-else />
                </n-icon>
              </template>
            </n-button>
          </div>
        </template>

        <div v-if="showForm">
          <div class="grid grid-cols-2 gap-4">
            <!-- 金额输入 -->
            <div>
              <n-input-number
                v-model:value="recordForm.amount"
                placeholder="输入金额"
                prefix="¥"
                class="w-full" />
            </div>

            <!-- 收支类型选择 -->
            <div class="flex items-center">
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
                placeholder="选择分类"
                :options="categories.filter(cat => cat.type === recordForm.type)"
                label-field="name"
                value-field="id"
                class="w-full" />
            </div>

            <!-- 日期选择 -->
            <div>
              <n-date-picker
                v-model:value="recordForm.date"
                type="date"
                placeholder="选择日期"
                class="w-full" />
            </div>

            <!-- 备注输入 -->
            <div class="col-span-2">
              <n-input
                v-model:value="recordForm.note"
                type="textarea"
                placeholder="备注（可选）"
                :autosize="{ minRows: 1, maxRows: 3 }" />
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <n-button type="primary" @click="addRecord">
              <template #icon>
                <n-icon><AddOutline /></n-icon>
              </template>
              添加记录
            </n-button>
          </div>
        </div>
      </n-card>

      <!-- 记录列表 -->
      <n-card :bordered="false">
        <template #header>
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span class="text-base font-medium">收支记录</span>

            <div class="flex items-center gap-3 flex-wrap">
              <!-- 筛选器 -->
              <n-radio-group v-model:value="filterType" @update:value="setFilterType">
                <n-space>
                  <n-radio value="all">全部</n-radio>
                  <n-radio value="income">收入</n-radio>
                  <n-radio value="expense">支出</n-radio>
                </n-space>
              </n-radio-group>

              <!-- 导入导出按钮 -->
              <n-space>
                <n-button size="small" @click="exportData('json')">
                  <template #icon>
                    <n-icon><DownloadOutline /></n-icon>
                  </template>
                  JSON
                </n-button>
                <n-button size="small" @click="exportData('xlsx')">
                  <template #icon>
                    <n-icon><DownloadOutline /></n-icon>
                  </template>
                  XLSX
                </n-button>
                <n-button size="small" type="primary" @click="importData">
                  <template #icon>
                    <n-icon><CloudUploadOutline /></n-icon>
                  </template>
                  导入
                </n-button>
              </n-space>
            </div>
          </div>
        </template>

        <!-- 记录表格 -->
        <n-data-table
          :columns="tableColumns"
          :data="records"
          :loading="loading"
          :pagination="false"
          :row-key="(row: AccountingRecord) => row.id"
          size="small" />

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
  </div>
</template>

<style scoped lang="scss">
.n-card {
  background-color: var(--cardColor);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.bg-white {
  background-color: var(--cardColor);
}
</style>

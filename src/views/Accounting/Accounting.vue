<script setup lang="ts">
import { useAccountingLogic } from './logic'

// 使用记账逻辑
const {
  recordForm,
  categories,
  addRecord,
  filterType,
  filteredRecords,
  deleteRecord,
  getCategoryName,
  totalIncome,
  totalExpense
} = useAccountingLogic()

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

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <n-card>
        <div class="text-center">
          <div class="text-sm text-gray-500 mb-1">本月收入</div>
          <div class="text-2xl font-bold text-green-500">¥{{ totalIncome.toFixed(2) }}</div>
        </div>
      </n-card>
      <n-card>
        <div class="text-center">
          <div class="text-sm text-gray-500 mb-1">本月支出</div>
          <div class="text-2xl font-bold text-red-500">¥{{ totalExpense.toFixed(2) }}</div>
        </div>
      </n-card>
    </div>

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
          <n-input
            v-model:value="recordForm.amount"
            type="text"
            placeholder="请输入金额"
            prefix="¥" />
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

    <!-- 收支记录列表 -->
    <n-card>
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">收支记录</h2>

          <!-- 筛选器 -->
          <n-radio-group v-model:value="filterType">
            <n-space>
              <n-radio value="all">全部</n-radio>
              <n-radio value="income">收入</n-radio>
              <n-radio value="expense">支出</n-radio>
            </n-space>
          </n-radio-group>
        </div>
      </template>

      <!-- 记录列表 -->
      <n-list v-if="filteredRecords.length > 0">
        <n-list-item v-for="record in filteredRecords" :key="record.id">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between w-full">
            <div class="flex items-center mb-2 sm:mb-0">
              <!-- 记录类型标识 -->
              <n-tag :type="record.type === 'income' ? 'success' : 'error'" class="mr-3">
                {{ record.type === 'income' ? '收入' : '支出' }}
              </n-tag>

              <!-- 记录详情 -->
              <div>
                <div class="font-medium">{{ getCategoryName(record.category, record.type) }}</div>
                <div class="text-sm text-gray-500">
                  {{ new Date(record.date).toLocaleDateString('zh-CN') }}
                  <span v-if="record.note" class="ml-2">{{ record.note }}</span>
                </div>
              </div>
            </div>

            <!-- 金额和操作 -->
            <div class="flex items-center">
              <div
                class="text-lg font-bold mr-4"
                :class="record.type === 'income' ? 'text-green-500' : 'text-red-500'">
                {{ record.type === 'income' ? '+' : '-' }}¥{{ record.amount.toFixed(2) }}
              </div>
              <n-button type="error" quaternary @click="deleteRecord(record.id)">删除</n-button>
            </div>
          </div>
        </n-list-item>
      </n-list>

      <!-- 空状态 -->
      <div v-else class="text-center py-8 text-gray-500">暂无收支记录</div>
    </n-card>
  </div>
</template>

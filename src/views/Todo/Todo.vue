<script setup lang="ts">
import { useTodoLogic } from './logic'
import {
  AddOutline,
  CheckmarkCircleOutline,
  TimeOutline,
  AlertCircleOutline,
  TrashOutline
} from '@vicons/ionicons5'

const {
  todos,
  newTodo,
  addTodo,
  removeTodo,
  toggleTodo,
  clearCompleted,
  remainingCount,
  filter,
  filteredTodos,
  setFilter
} = useTodoLogic()

const deadline = ref<number | null>(null)

// 判断截止日期是否临近（距离今天不足3天）
const isDeadlineApproaching = (deadlineTimestamp: number, completed: boolean) => {
  if (completed) return false

  const deadlineDate = new Date(deadlineTimestamp)
  const today = new Date()
  const timeDiff = deadlineDate.getTime() - today.getTime()
  const daysDiff = timeDiff / (1000 * 3600 * 24)

  return daysDiff >= 0 && daysDiff <= 3
}

// 判断是否已过期
const isDeadlinePassed = (deadlineTimestamp: number, completed: boolean) => {
  if (completed) return false

  const deadlineDate = new Date(deadlineTimestamp)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return deadlineDate < today
}

// 计算剩余时间
const getRemainingTime = (deadlineTimestamp: number) => {
  const deadlineDate = new Date(deadlineTimestamp)
  const now = new Date()
  const timeDiff = deadlineDate.getTime() - now.getTime()

  if (timeDiff <= 0) {
    return '已过期'
  }

  const days = Math.floor(timeDiff / (1000 * 3600 * 24))
  const hours = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600))

  if (days > 0) {
    return `${days}天${hours}小时`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    return '不到1小时'
  }
}

const handleAddTodo = () => {
  addTodo(deadline.value ?? undefined)
  deadline.value = null
}

// 统计数据
const totalCount = computed(() => todos.value.length)
const completedCount = computed(() => todos.value.filter(t => t.completed).length)
const pendingCount = computed(() => todos.value.filter(t => !t.completed).length)
const overdueCount = computed(
  () =>
    todos.value.filter(t => !t.completed && t.deadline && isDeadlinePassed(t.deadline!, false))
      .length
)
</script>

<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <!-- 页面标题 -->
    <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0">
      <h2 class="text-lg font-semibold">待办事项</h2>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 overflow-auto p-4">
      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-blue-500">
              <TimeOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">总数</div>
              <div class="text-xl font-bold">{{ totalCount }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-orange-500">
              <AlertCircleOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">待完成</div>
              <div class="text-xl font-bold">{{ pendingCount }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-green-500">
              <CheckmarkCircleOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">已完成</div>
              <div class="text-xl font-bold">{{ completedCount }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-red-500">
              <TimeOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">已过期</div>
              <div class="text-xl font-bold">{{ overdueCount }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加任务区域 -->
      <n-card class="mb-4" :bordered="false">
        <div class="flex flex-col sm:flex-row gap-3">
          <n-input
            v-model:value="newTodo"
            placeholder="输入新任务..."
            class="flex-1"
            @keyup.enter="handleAddTodo" />
          <n-date-picker
            v-model:value="deadline"
            type="date"
            placeholder="截止日期"
            class="sm:w-44" />
          <n-button type="primary" class="px-6" @click="handleAddTodo">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            添加
          </n-button>
        </div>
      </n-card>

      <!-- 任务列表 -->
      <n-card :bordered="false">
        <template #header>
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span class="text-base font-medium">任务列表</span>

            <!-- 过滤器 -->
            <n-radio-group :value="filter" @update:value="setFilter">
              <n-space>
                <n-radio value="all">全部</n-radio>
                <n-radio value="active">未完成</n-radio>
                <n-radio value="completed">已完成</n-radio>
              </n-space>
            </n-radio-group>
          </div>
        </template>

        <!-- 任务列表 -->
        <div class="divide-y divide-gray-100">
          <div
            v-for="todo in filteredTodos"
            :key="todo.id"
            class="flex items-center gap-3 py-3 px-2 hover:bg-gray-50 transition-colors duration-150 group">
            <!-- 复选框 -->
            <n-checkbox
              :checked="todo.completed"
              @update:checked="toggleTodo(todo.id)"
              class="flex-shrink-0" />

            <!-- 任务内容 -->
            <div class="flex-1 min-w-0">
              <div
                :class="[
                  'text-sm leading-relaxed',
                  todo.completed ? 'line-through text-gray-400' : 'text-gray-700'
                ]">
                {{ todo.text }}
              </div>

              <!-- 截止日期信息 -->
              <div
                v-if="todo.deadline"
                :class="[
                  'flex items-center gap-1.5 mt-1 text-xs transition-colors',
                  isDeadlinePassed(todo.deadline, todo.completed)
                    ? 'text-red-500 font-medium'
                    : isDeadlineApproaching(todo.deadline, todo.completed)
                      ? 'text-orange-500 font-medium'
                      : 'text-gray-400'
                ]">
                <n-icon size="12"><TimeOutline /></n-icon>
                <span>{{ new Date(todo.deadline).toLocaleDateString('zh-CN') }}</span>
                <span
                  v-if="!todo.completed && isDeadlinePassed(todo.deadline, todo.completed)"
                  class="font-semibold">
                  (已过期)
                </span>
                <span
                  v-else-if="
                    !todo.completed && isDeadlineApproaching(todo.deadline, todo.completed)
                  "
                  class="font-semibold">
                  (临近)
                </span>
                <span v-else-if="!todo.completed" class="text-gray-300">
                  ({{ getRemainingTime(todo.deadline) }})
                </span>
              </div>
            </div>

            <!-- 删除按钮 -->
            <n-button
              type="error"
              quaternary
              circle
              size="small"
              class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0"
              @click="removeTodo(todo.id)">
              <template #icon>
                <n-icon><TrashOutline /></n-icon>
              </template>
            </n-button>
          </div>

          <!-- 空状态 -->
          <div v-if="todos.length === 0" class="py-16 text-center">
            <div class="text-4xl mb-3">
              <n-icon size="48" :depth="3"><TimeOutline /></n-icon>
            </div>
            <div class="text-gray-400 text-base mb-1">暂无待办事项</div>
            <div class="text-gray-300 text-sm">添加一个新任务开始吧</div>
          </div>

          <!-- 无筛选结果 -->
          <div v-else-if="filteredTodos.length === 0" class="py-16 text-center">
            <div class="text-4xl mb-3">
              <n-icon size="48" :depth="3"><CheckmarkCircleOutline /></n-icon>
            </div>
            <div class="text-gray-400 text-base">
              {{ filter === 'active' ? '所有任务都已完成 🎉' : '没有已完成的任务' }}
            </div>
          </div>
        </div>

        <!-- 底部统计栏 -->
        <template #footer>
          <div class="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <span>
                剩余
                <span class="font-semibold text-gray-700">{{ remainingCount }}</span>
                项未完成
              </span>
              <n-divider vertical />
              <span>
                共
                <span class="font-semibold text-gray-700">{{ totalCount }}</span>
                项
              </span>
            </div>

            <n-button
              @click="clearCompleted"
              v-if="todos.some(t => t.completed)"
              type="error"
              tertiary
              size="small">
              清除已完成
            </n-button>
          </div>
        </template>
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

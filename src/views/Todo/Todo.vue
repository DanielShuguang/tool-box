<script setup lang="ts">
import { useTodoLogic } from './logic'

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
</script>

<template>
  <div class="w-full p-6">
    <!-- 标题区域 -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-800 mb-1">待办事项</h1>
      <p class="text-sm text-gray-500">记录和管理你的日常任务</p>
    </div>

    <!-- 添加新任务区域 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <n-input
          v-model:value="newTodo"
          placeholder="输入新任务..."
          @keyup.enter="handleAddTodo"
          class="flex-1">
          <template #prefix>
            <span class="text-gray-400">📝</span>
          </template>
        </n-input>
        <n-date-picker
          v-model:value="deadline"
          type="date"
          placeholder="截止日期"
          class="sm:w-44" />
        <n-button type="primary" class="px-6" @click="handleAddTodo"> 添加 </n-button>
      </div>
    </div>

    <!-- 任务列表卡片 -->
    <n-card class="overflow-hidden">
      <!-- 任务列表 -->
      <div class="divide-y divide-gray-100">
        <div
          v-for="todo in filteredTodos"
          :key="todo.id"
          class="flex items-center gap-4 py-4 px-2 hover:bg-gray-50 transition-colors duration-150 group">
          <!-- 复选框 -->
          <n-checkbox
            :checked="todo.completed"
            @update:checked="toggleTodo(todo.id)"
            class="flex-shrink-0" />

          <!-- 任务内容 -->
          <div class="flex-1 min-w-0">
            <div
              :class="[
                'text-base leading-relaxed',
                todo.completed ? 'line-through text-gray-400' : 'text-gray-700'
              ]">
              {{ todo.text }}
            </div>

            <!-- 截止日期信息 -->
            <div
              v-if="todo.deadline"
              :class="[
                'flex items-center gap-2 mt-1.5 text-sm transition-colors',
                isDeadlineApproaching(todo.deadline, todo.completed)
                  ? 'text-red-500 font-medium'
                  : 'text-gray-400'
              ]">
              <span class="text-xs">📅</span>
              <span>{{ new Date(todo.deadline).toLocaleDateString('zh-CN') }}</span>
              <span
                v-if="!todo.completed && isDeadlineApproaching(todo.deadline, todo.completed)"
                class="flex items-center gap-1 text-red-500 font-semibold">
                <span>⚠️</span>
                <span>临近</span>
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
              <span class="text-red-400">🗑️</span>
            </template>
          </n-button>
        </div>

        <!-- 空状态 -->
        <div v-if="todos.length === 0" class="py-16 text-center">
          <div class="text-4xl mb-3">📋</div>
          <div class="text-gray-400 text-base mb-1">暂无待办事项</div>
          <div class="text-gray-300 text-sm">添加一个新任务开始吧</div>
        </div>

        <!-- 无筛选结果 -->
        <div v-else-if="filteredTodos.length === 0" class="py-16 text-center">
          <div class="text-4xl mb-3">🔍</div>
          <div class="text-gray-400 text-base">
            {{ filter === 'active' ? '所有任务都已完成 🎉' : '没有已完成的任务' }}
          </div>
        </div>
      </div>

      <!-- 底部统计栏 -->
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <!-- 剩余计数 -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">
              剩余
              <span class="font-semibold text-gray-700">{{ remainingCount }}</span>
              项未完成
            </span>
          </div>

          <!-- 过滤器按钮组 -->
          <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              v-for="f in ['all', 'active', 'completed'] as const"
              :key="f"
              @click="setFilter(f)"
              :class="[
                'px-4 py-1.5 text-sm rounded-md transition-all duration-150',
                filter === f
                  ? 'bg-white text-gray-700 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-600'
              ]">
              {{ f === 'all' ? '全部' : f === 'active' ? '未完成' : '已完成' }}
            </button>
          </div>

          <!-- 清除已完成 -->
          <n-button
            @click="clearCompleted"
            v-if="todos.some(t => t.completed)"
            type="error"
            tertiary
            size="small"
            class="text-red-500">
            清除已完成
          </n-button>
        </div>
      </template>
    </n-card>
  </div>
</template>

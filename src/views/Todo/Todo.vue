<script setup lang="ts">
import { useTodoLogic } from './logic'
import { ref } from 'vue'

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
  setFilter,
} = useTodoLogic()

const deadline = ref<number | null>(null)

// 判断截止日期是否临近（距离今天不足3天）
// 已完成的任务不需要展示警告
const isDeadlineApproaching = (deadlineTimestamp: number, completed: boolean) => {
  // 已完成的任务不显示警告
  if (completed) return false

  const deadlineDate = new Date(deadlineTimestamp)
  const today = new Date()
  const timeDiff = deadlineDate.getTime() - today.getTime()
  const daysDiff = timeDiff / (1000 * 3600 * 24)

  // 临近条件：日期大于等于今天且小于3天后
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
  <div class="w-full p-4">
    <!-- 添加新任务 -->
    <div class="flex flex-col sm:flex-row gap-2 mb-6">
      <n-input v-model:value="newTodo" placeholder="添加新任务..." @keyup.enter="handleAddTodo" />
      <n-date-picker
        v-model:value="deadline"
        type="date"
        placeholder="可选截止日期"
        class="sm:w-40" />
      <n-button type="primary" @click="handleAddTodo"> 添加 </n-button>
    </div>

    <!-- 任务列表 -->
    <n-card>
      <n-list>
        <n-list-item v-for="todo in filteredTodos" :key="todo.id">
          <div class="flex items-center">
            <n-checkbox :checked="todo.completed" @update:checked="toggleTodo(todo.id)" />
            <div class="ml-3 flex-1">
              <div :class="{ 'line-through text-gray-400': todo.completed }">
                {{ todo.text }}
              </div>
              <div
                v-if="todo.deadline"
                class="text-xs mt-1"
                :class="isDeadlineApproaching(todo.deadline, todo.completed) ? 'text-red-500 font-bold' : 'text-gray-500'">
                截止日期: {{ new Date(todo.deadline).toLocaleDateString('zh-CN') }}
                <span v-if="!todo.completed"> (剩余: {{ getRemainingTime(todo.deadline) }})</span>
                <span v-if="isDeadlineApproaching(todo.deadline, todo.completed)">
                  ⚠️ 临近截止</span
                >
              </div>
            </div>
            <n-button type="error" quaternary @click="removeTodo(todo.id)"> 删除 </n-button>
          </div>
        </n-list-item>
        <n-list-item v-if="todos.length === 0">
          <div class="text-center text-gray-500 w-full">暂无待办事项</div>
        </n-list-item>
      </n-list>

      <!-- 底部统计和过滤器 -->
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-between items-center mt-4">
          <div class="mb-2 sm:mb-0">
            <span class="text-gray-600"> 剩余 {{ remainingCount }} 项未完成 </span>
          </div>

          <div class="flex space-x-2 mb-2 sm:mb-0">
            <n-button
              @click="setFilter('all')"
              :type="filter === 'all' ? 'primary' : 'default'"
              secondary
              size="small">
              全部
            </n-button>
            <n-button
              @click="setFilter('active')"
              :type="filter === 'active' ? 'primary' : 'default'"
              secondary
              size="small">
              未完成
            </n-button>
            <n-button
              @click="setFilter('completed')"
              :type="filter === 'completed' ? 'primary' : 'default'"
              secondary
              size="small">
              已完成
            </n-button>
          </div>

          <n-button
            @click="clearCompleted"
            v-if="todos.some(t => t.completed)"
            type="error"
            secondary
            size="small">
            清除已完成
          </n-button>
        </div>
      </template>
    </n-card>
  </div>
</template>

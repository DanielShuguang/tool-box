import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ConfigFile } from '@/utils/storage'

export interface Todo {
  id: number
  text: string
  completed: boolean
  deadline?: number // 时间戳格式的日期，可选
}

export type FilterType = 'all' | 'active' | 'completed'

export const useTodoStore = defineStore(
  'todo',
  () => {
    const todos = ref<Todo[]>([])

    // 添加新任务
    function addTodo(todo: Todo) {
      todos.value.push(todo)
    }

    // 删除任务
    function removeTodo(id: number) {
      todos.value = todos.value.filter(t => t.id !== id)
    }

    // 切换任务完成状态
    function toggleTodo(id: number) {
      const todo = todos.value.find(t => t.id === id)
      if (todo) {
        todo.completed = !todo.completed
      }
    }

    // 清除已完成的任务
    function clearCompleted() {
      todos.value = todos.value.filter(todo => !todo.completed)
    }

    // 设置所有 todos（用于批量更新）
    function setTodos(newTodos: Todo[]) {
      todos.value = newTodos
    }

    return {
      todos,
      addTodo,
      removeTodo,
      toggleTodo,
      clearCompleted,
      setTodos
    }
  },
  {
    persist: {
      fileName: ConfigFile.Settings,
      key: 'todos'
    }
  }
)

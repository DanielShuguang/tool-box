import { ref, computed } from 'vue'
import { usePersistentStorage } from '@/hooks/usePersistentStorage'

export interface Todo {
  id: number
  text: string
  completed: boolean
  deadline?: number // 时间戳格式的日期，可选
}

export type FilterType = 'all' | 'active' | 'completed'

export function useTodoLogic() {
  // 使用持久化存储来保存todos
  const todos = usePersistentStorage<Todo[]>('todos', [])

  // 定义设置todos的方法
  const setTodos = (newTodos: Todo[]) => {
    todos.value = newTodos
  }
  const newTodo = ref('')
  const filter = ref<FilterType>('all')

  // 添加新任务
  const addTodo = (deadline?: number | null) => {
    if (newTodo.value.trim() === '') return

    const todo: Todo = {
      id: Date.now(),
      text: newTodo.value.trim(),
      completed: false,
      deadline
    }

    setTodos([...todos.value, todo])
    newTodo.value = ''
  }

  // 删除任务
  const removeTodo = (id: number) => {
    setTodos(todos.value.filter(todo => todo.id !== id))
  }

  // 切换任务完成状态
  const toggleTodo = (id: number) => {
    setTodos(
      todos.value.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    )
  }

  // 清除已完成的任务
  const clearCompleted = () => {
    setTodos(todos.value.filter(todo => !todo.completed))
  }

  // 根据过滤器筛选任务
  const filteredTodos = computed(() => {
    switch (filter.value) {
      case 'active':
        return todos.value.filter(todo => !todo.completed)
      case 'completed':
        return todos.value.filter(todo => todo.completed)
      default:
        return todos.value
    }
  })

  // 计算剩余未完成任务数
  const remainingCount = computed(() => {
    return todos.value.filter(todo => !todo.completed).length
  })

  // 设置过滤器
  const setFilter = (newFilter: FilterType) => {
    filter.value = newFilter
  }

  return {
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
  }
}

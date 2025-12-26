import { ref, computed } from 'vue'
import { useTodoStore, type Todo, type FilterType } from '@/stores/todo'

export type { Todo, FilterType }

export function useTodoLogic() {
  // 使用 TodoStore 进行状态管理
  const todoStore = useTodoStore()
  const {
    addTodo: storeAddTodo,
    removeTodo: storeRemoveTodo,
    toggleTodo: storeToggleTodo,
    clearCompleted: storeClearCompleted
  } = todoStore
  const { todos } = storeToRefs(todoStore)

  const newTodo = ref('')
  const filter = ref<FilterType>('all')

  // 添加新任务
  const addTodo = (deadline?: number) => {
    if (newTodo.value.trim() === '') return

    const todo: Todo = {
      id: Date.now(),
      text: newTodo.value.trim(),
      completed: false,
      deadline
    }

    storeAddTodo(todo)
    newTodo.value = ''
  }

  // 删除任务
  const removeTodo = (id: number) => {
    storeRemoveTodo(id)
  }

  // 切换任务完成状态
  const toggleTodo = (id: number) => {
    storeToggleTodo(id)
  }

  // 清除已完成的任务
  const clearCompleted = () => {
    storeClearCompleted()
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

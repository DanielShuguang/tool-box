describe('Todo Module', () => {
  beforeEach(async () => {
    const navBtn = $('[data-testid="nav-todo"]')
    await navBtn.click()
  })

  describe('Main View', () => {
    it('should display the page title', async () => {
      const title = $('h2=待办事项')
      await expect(title).toBeDisplayed()
    })

    it('should show input, date picker and add button', async () => {
      const input = $('[data-testid="todo-input"]')
      const datePicker = $('[data-testid="todo-deadline-picker"]')
      const addBtn = $('[data-testid="todo-add-btn"]')

      await expect(input).toBeDisplayed()
      await expect(datePicker).toBeDisplayed()
      await expect(addBtn).toBeDisplayed()
      await expect(addBtn).toHaveText('添加')
    })

    it('should show filter options', async () => {
      const all = $('[data-testid="todo-filter-all"]')
      const active = $('[data-testid="todo-filter-active"]')
      const completed = $('[data-testid="todo-filter-completed"]')

      await expect(all).toBeDisplayed()
      await expect(all).toHaveText('全部')
      await expect(active).toBeDisplayed()
      await expect(active).toHaveText('未完成')
      await expect(completed).toBeDisplayed()
      await expect(completed).toHaveText('已完成')
    })

    it('should show statistics cards', async () => {
      const total = $('[data-testid="todo-stat-total"]')
      const pending = $('[data-testid="todo-stat-pending"]')
      const completed = $('[data-testid="todo-stat-completed"]')
      const overdue = $('[data-testid="todo-stat-overdue"]')

      await expect(total).toBeDisplayed()
      await expect(pending).toBeDisplayed()
      await expect(completed).toBeDisplayed()
      await expect(overdue).toBeDisplayed()
    })
  })

  describe('Add Todo', () => {
    it('should add a task via button click', async () => {
      const input = $('[data-testid="todo-input"]')
      const addBtn = $('[data-testid="todo-add-btn"]')
      const taskText = `E2E Task ${Date.now()}`

      await input.setValue(taskText)
      await addBtn.click()

      const task = $(`div=${taskText}`)
      await expect(task).toBeDisplayed()
    })

    it('should add a task via Enter key', async () => {
      const input = $('[data-testid="todo-input"]')
      const taskText = `E2E Enter Task ${Date.now()}`

      await input.setValue(taskText)
      await browser.keys('Enter')

      const task = $(`div=${taskText}`)
      await expect(task).toBeDisplayed()
    })

    it('should clear input after adding a task', async () => {
      const input = $('[data-testid="todo-input"]')
      const addBtn = $('[data-testid="todo-add-btn"]')

      await input.setValue('Temporary Task')
      await addBtn.click()
      await expect(input).toHaveValue('')
    })
  })

  describe('Todo Actions', () => {
    it('should toggle task completion', async () => {
      const testText = `Toggle Task ${Date.now()}`
      const input = $('[data-testid="todo-input"]')
      await input.setValue(testText)
      await browser.keys('Enter')

      const text = $(`div=${testText}`)
      await expect(text).toBeDisplayed()

      const item = text.parentElement()
      const checkbox = item.$('[data-testid^="todo-checkbox-"]')
      await checkbox.click()

      const statPending = $('[data-testid="todo-stat-pending"]')
      await expect(statPending).toBeDisplayed()
    })

    it('should delete a task', async () => {
      const testText = `Delete Task ${Date.now()}`
      const input = $('[data-testid="todo-input"]')
      await input.setValue(testText)
      await browser.keys('Enter')

      const text = $(`div=${testText}`)
      await expect(text).toBeDisplayed()

      const item = text.parentElement()
      const deleteBtn = item.$('[data-testid^="todo-delete-"]')
      await deleteBtn.click()

      await expect(text).not.toBeDisplayed()
    })

    it('should clear completed tasks', async () => {
      const testText = `Clear Task ${Date.now()}`
      const input = $('[data-testid="todo-input"]')
      await input.setValue(testText)
      await browser.keys('Enter')

      const text = $(`div=${testText}`)
      await expect(text).toBeDisplayed()

      const item = text.parentElement()
      const checkbox = item.$('[data-testid^="todo-checkbox-"]')
      await checkbox.click()

      const clearBtn = $('[data-testid="todo-clear-completed"]')
      await clearBtn.click()
      await expect(text).not.toBeDisplayed()
    })
  })

  describe('Filter', () => {
    it('should show active tasks filter', async () => {
      const filterActive = $('[data-testid="todo-filter-active"]')
      await filterActive.click()

      const completed = $('[data-testid="todo-stat-completed"]')
      await expect(completed).toBeDisplayed()
    })

    it('should show all tasks filter', async () => {
      const filterAll = $('[data-testid="todo-filter-all"]')
      await filterAll.click()

      const statTotal = $('[data-testid="todo-stat-total"]')
      await expect(statTotal).toBeDisplayed()
    })
  })
})

describe('Random Picker Module', () => {
  beforeEach(async () => {
    const navBtn = $('[data-testid="nav-randomPicker"]')
    await navBtn.click()
  })

  describe('Main View', () => {
    it('should display the page title and subtitle', async () => {
      const title = $('h1=随机选择器')
      await expect(title).toBeDisplayed()

      const subtitle = $('p=快速、公平、随机 - 告别选择困难')
      await expect(subtitle).toBeDisplayed()
    })

    it('should show statistics cards', async () => {
      const total = $('[data-testid="picker-stat-total"]')
      const available = $('[data-testid="picker-stat-available"]')
      const disabled = $('[data-testid="picker-stat-disabled"]')

      await expect(total).toBeDisplayed()
      await expect(available).toBeDisplayed()
      await expect(disabled).toBeDisplayed()
    })

    it('should show quick action buttons', async () => {
      const historyBtn = $('[data-testid="picker-btn-history"]')
      const exportBtn = $('[data-testid="picker-btn-export"]')

      await expect(historyBtn).toBeDisplayed()
      await expect(historyBtn).toHaveText('查看历史')
      await expect(exportBtn).toBeDisplayed()
      await expect(exportBtn).toHaveText('导出结果')
    })

    it('should show pick mode selection', async () => {
      const normal = $('[data-testid="pick-mode-normal"]')
      const sequential = $('[data-testid="pick-mode-sequential"]')
      const weighted = $('[data-testid="pick-mode-weighted"]')

      await expect(normal).toBeDisplayed()
      await expect(sequential).toBeDisplayed()
      await expect(weighted).toBeDisplayed()
    })
  })

  describe('Add Options', () => {
    it('should show add button in option list header', async () => {
      const addBtn = $('[data-testid="option-add-btn"]')
      await expect(addBtn).toBeDisplayed()
      await expect(addBtn).toHaveText('添加选项')
    })

    it('should add options via modal', async () => {
      const addBtn = $('[data-testid="option-add-btn"]')
      await addBtn.click()

      const textarea = $('[data-testid="option-add-textarea"]')
      await textarea.setValue('选项A\n选项B\n选项C')

      const confirmBtn = $('[data-testid="option-add-confirm"]')
      await confirmBtn.click()

      const nameA = $('span=选项A')
      const nameB = $('span=选项B')
      const nameC = $('span=选项C')
      await expect(nameA).toBeDisplayed()
      await expect(nameB).toBeDisplayed()
      await expect(nameC).toBeDisplayed()
    })
  })

  describe('Pick Action', () => {
    beforeEach(async () => {
      const addBtn = $('[data-testid="option-add-btn"]')
      await addBtn.click()
      const textarea = $('[data-testid="option-add-textarea"]')
      await textarea.setValue('选项1\n选项2\n选项3')
      const confirmBtn = $('[data-testid="option-add-confirm"]')
      await confirmBtn.click()
    })

    it('should show pick button', async () => {
      const pickBtn = $('[data-testid="pick-btn"]')
      await expect(pickBtn).toBeDisplayed()
    })

    it('should show result modal after picking', async () => {
      const pickBtn = $('[data-testid="pick-btn"]')
      await pickBtn.click()

      const resultOk = $('[data-testid="pick-result-ok"]')
      await expect(resultOk).toBeDisplayed()
      await expect(resultOk).toHaveText('知道了！')
    })

    it('should dismiss result modal on "知道了！" click', async () => {
      const pickBtn = $('[data-testid="pick-btn"]')
      await pickBtn.click()

      const resultOk = $('[data-testid="pick-result-ok"]')
      await resultOk.click()

      await expect(resultOk).not.toBeDisplayed()
    })
  })

  describe('Delete Options', () => {
    it('should delete an option', async () => {
      const addBtn = $('[data-testid="option-add-btn"]')
      await addBtn.click()
      const textarea = $('[data-testid="option-add-textarea"]')
      await textarea.setValue('ToDelete')
      const confirmBtn = $('[data-testid="option-add-confirm"]')
      await confirmBtn.click()

      const text = $('span=ToDelete')
      await expect(text).toBeDisplayed()

      const item = text.parentElement()
      const deleteBtn = item.$('[data-testid^="option-delete-"]')
      await deleteBtn.click()

      await expect(text).not.toBeDisplayed()
    })
  })
})

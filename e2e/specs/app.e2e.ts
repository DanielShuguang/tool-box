describe('Tool Box App', () => {
  it('should show the titlebar', async () => {
    const titlebar = $('[data-testid="titlebar"]')
    await expect(titlebar).toBeDisplayed()
  })

  it('should show sidebar navigation', async () => {
    const navBtns = $$('[data-testid^="nav-"]')
    expect(navBtns.length).toBeGreaterThanOrEqual(8)
  })

  it('should navigate to translator page on click', async () => {
    const translatorBtn = $('[data-testid="nav-translator"]')
    await translatorBtn.click()

    const translatorTitle = $('h2=翻译工具')
    await expect(translatorTitle).toBeDisplayed()
  })

  it('should navigate to todo page on click', async () => {
    const todoBtn = $('[data-testid="nav-todo"]')
    await todoBtn.click()

    const todoTitle = $('h2=待办事项')
    await expect(todoTitle).toBeDisplayed()
  })
})

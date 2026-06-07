describe('Tool Box App', () => {
  it('should show the titlebar', async () => {
    const titlebar = await $('header.titlebar')
    await expect(titlebar).toBeDisplayed()
  })

  it('should show sidebar navigation', async () => {
    const navBtns = await $$('button.nav-btn')
    await expect(navBtns.length).toBeGreaterThanOrEqual(8)
  })

  it('should navigate to translator page on click', async () => {
    const translatorBtn = await $('button.nav-btn:nth-child(5)')
    await translatorBtn.click()

    const translatorTitle = await $('h2=翻译工具')
    await expect(translatorTitle).toBeDisplayed()
  })

  it('should navigate to todo page on click', async () => {
    const todoBtn = await $('button.nav-btn:nth-child(6)')
    await todoBtn.click()

    const todoTitle = await $('h2=待办事项')
    await expect(todoTitle).toBeDisplayed()
  })
})

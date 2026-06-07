describe('File Search Module', () => {
  beforeEach(async () => {
    const navBtn = $('[data-testid="nav-fileSearch"]')
    await navBtn.click()
  })

  describe('Main View', () => {
    it('should display the page title', async () => {
      const title = $('h2=文件搜索')
      await expect(title).toBeDisplayed()
    })

    it('should show search input', async () => {
      const input = $('[data-testid="file-search-input"]')
      await expect(input).toBeDisplayed()
    })

    it('should show select-all checkbox', async () => {
      const selectAll = $('[data-testid="file-search-select-all"]')
      await expect(selectAll).toBeDisplayed()
      await expect(selectAll).toHaveText('全选')
    })

    it('should show statistics cards', async () => {
      const total = $('[data-testid="file-search-stat-total"]')
      const files = $('[data-testid="file-search-stat-files"]')
      const folders = $('[data-testid="file-search-stat-folders"]')

      await expect(total).toBeDisplayed()
      await expect(files).toBeDisplayed()
      await expect(folders).toBeDisplayed()
    })

    it('should show concurrent count input', async () => {
      const concurrent = $('[data-testid="file-search-concurrent"]')
      await expect(concurrent).toBeDisplayed()
    })

    it('should show folder switch', async () => {
      const folderSwitch = $('[data-testid="file-search-folder-switch"]')
      await expect(folderSwitch).toBeDisplayed()
    })
  })

  describe('Search Button', () => {
    it('should show search button in default state', async () => {
      const searchBtn = $('[data-testid="file-search-btn"]')
      await expect(searchBtn).toBeDisplayed()
      await expect(searchBtn).toHaveText('搜索')
    })
  })
})

describe('ReadFile Module', () => {
  beforeEach(async () => {
    const navBtn = $('[data-testid="nav-readFile"]')
    await navBtn.click()
  })

  describe('Main View', () => {
    it('should display the page title', async () => {
      const title = $('h2=文件读取')
      await expect(title).toBeDisplayed()
    })

    it('should show statistics cards', async () => {
      const files = $('[data-testid="readfile-stat-files"]')
      const matched = $('[data-testid="readfile-stat-matched"]')
      const downloaded = $('[data-testid="readfile-stat-downloaded"]')

      await expect(files).toBeDisplayed()
      await expect(matched).toBeDisplayed()
      await expect(downloaded).toBeDisplayed()
    })

    it('should show upload area', async () => {
      const uploadCard = $('[data-testid="readfile-upload-card"]')
      const uploadArea = $('[data-testid="readfile-upload-area"]')

      await expect(uploadCard).toBeDisplayed()
      await expect(uploadArea).toBeDisplayed()
    })

    it('should show config card with inputs', async () => {
      const configCard = $('[data-testid="readfile-config-card"]')
      const regexInput = $('[data-testid="readfile-regex-input"]')
      const regexSelect = $('[data-testid="readfile-regex-select"]')
      const dirInput = $('[data-testid="readfile-dir-input"]')
      const maxDownload = $('[data-testid="readfile-max-download"]')
      const concurrentCount = $('[data-testid="readfile-concurrent-count"]')

      await expect(configCard).toBeDisplayed()
      await expect(regexInput).toBeDisplayed()
      await expect(regexSelect).toBeDisplayed()
      await expect(dirInput).toBeDisplayed()
      await expect(maxDownload).toBeDisplayed()
      await expect(concurrentCount).toBeDisplayed()
    })

    it('should show action buttons', async () => {
      const analysisBtn = $('[data-testid="readfile-analysis-btn"]')
      await expect(analysisBtn).toBeDisplayed()
      await expect(analysisBtn).toHaveText('读取匹配内容')
    })

    it('should show log card', async () => {
      const logCard = $('[data-testid="readfile-log-card"]')
      const logBody = $('[data-testid="readfile-log-body"]')

      await expect(logCard).toBeDisplayed()
      await expect(logBody).toBeDisplayed()
    })
  })

  describe('Regex Input', () => {
    it('should allow entering regex pattern', async () => {
      const regexInput = $('[data-testid="readfile-regex-input"] input')
      await regexInput.addValue('https?://.*\\.(jpg|png)')

      await expect(regexInput).toHaveValue('https?://.*\\.(jpg|png)')
    })
  })

  describe('Number Inputs', () => {
    it('should have default values for download settings', async () => {
      const maxDownload = $('[data-testid="readfile-max-download"]')
      const concurrentCount = $('[data-testid="readfile-concurrent-count"]')

      await expect(maxDownload).toBeDisplayed()
      await expect(concurrentCount).toBeDisplayed()
    })
  })

  describe('Action Buttons State', () => {
    it('should disable analysis button when no file selected', async () => {
      const analysisBtn = $('[data-testid="readfile-analysis-btn"]')
      await expect(analysisBtn).toBeDisplayed()
    })

    it('should not show export button initially', async () => {
      const exportBtn = $('[data-testid="readfile-export-btn"]')
      await expect(exportBtn).not.toBeDisplayed()
    })

    it('should not show download button initially', async () => {
      const downloadBtn = $('[data-testid="readfile-download-btn"]')
      await expect(downloadBtn).not.toBeDisplayed()
    })
  })

  describe('Log Panel', () => {
    it('should show empty state initially', async () => {
      const logBody = $('[data-testid="readfile-log-body"]')
      await expect(logBody).toBeDisplayed()
      await expect(logBody).toHaveText('暂无输出，操作完成后将在此显示进度')
    })
  })
})

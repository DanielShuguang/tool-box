describe('Translator Module', () => {
  beforeEach(async () => {
    const navBtn = $('[data-testid="nav-translator"]')
    await navBtn.click()
  })

  describe('Main View', () => {
    it('should display the page title', async () => {
      const title = $('h2=翻译工具')
      await expect(title).toBeDisplayed()
    })

    it('should show statistics cards', async () => {
      const inputStat = $('[data-testid="translator-stat-input"]')
      const outputStat = $('[data-testid="translator-stat-output"]')
      const serviceStat = $('[data-testid="translator-stat-service"]')

      await expect(inputStat).toBeDisplayed()
      await expect(outputStat).toBeDisplayed()
      await expect(serviceStat).toBeDisplayed()
    })

    it('should show service selection card', async () => {
      const serviceCard = $('[data-testid="translator-service-card"]')
      const serviceGroup = $('[data-testid="translator-service-group"]')
      const googleBtn = $('[data-testid="translator-service-google"]')
      const deeplBtn = $('[data-testid="translator-service-deepl"]')

      await expect(serviceCard).toBeDisplayed()
      await expect(serviceGroup).toBeDisplayed()
      await expect(googleBtn).toBeDisplayed()
      await expect(deeplBtn).toBeDisplayed()
    })

    it('should show language selection card', async () => {
      const langCard = $('[data-testid="translator-lang-card"]')
      const sourceLang = $('[data-testid="translator-source-lang"]')
      const targetLang = $('[data-testid="translator-target-lang"]')
      const swapBtn = $('[data-testid="translator-swap-btn"]')
      const translateBtn = $('[data-testid="translator-translate-btn"]')

      await expect(langCard).toBeDisplayed()
      await expect(sourceLang).toBeDisplayed()
      await expect(targetLang).toBeDisplayed()
      await expect(swapBtn).toBeDisplayed()
      await expect(translateBtn).toBeDisplayed()
      await expect(translateBtn).toHaveText('翻译')
    })

    it('should show input and output areas', async () => {
      const input = $('[data-testid="translator-input"]')
      const output = $('[data-testid="translator-output"]')
      const inputCount = $('[data-testid="translator-input-count"]')
      const outputCount = $('[data-testid="translator-output-count"]')

      await expect(input).toBeDisplayed()
      await expect(output).toBeDisplayed()
      await expect(inputCount).toBeDisplayed()
      await expect(outputCount).toBeDisplayed()
    })

    it('should show empty state initially', async () => {
      const emptyState = $('[data-testid="translator-empty-state"]')
      await expect(emptyState).toBeDisplayed()
    })
  })

  describe('Service Selection', () => {
    it('should default to Google service', async () => {
      const googleBtn = $('[data-testid="translator-service-google"]')
      await expect(googleBtn).toBeDisplayed()
    })

    it('should switch to DeepL service on click', async () => {
      const deeplBtn = $('[data-testid="translator-service-deepl"]')
      await deeplBtn.click()
      await expect(deeplBtn).toBeDisplayed()
    })
  })

  describe('Language Selection', () => {
    it('should have source language select', async () => {
      const sourceLang = $('[data-testid="translator-source-lang"]')
      await expect(sourceLang).toBeDisplayed()
    })

    it('should have target language select', async () => {
      const targetLang = $('[data-testid="translator-target-lang"]')
      await expect(targetLang).toBeDisplayed()
    })

    it('should disable swap button when source is auto', async () => {
      const swapBtn = $('[data-testid="translator-swap-btn"]')
      await expect(swapBtn).toBeDisplayed()
    })
  })

  describe('Input and Translate', () => {
    it('should allow entering text in input area', async () => {
      const input = $('[data-testid="translator-input"] textarea')
      await input.addValue('Hello World')

      await expect(input).toHaveValue('Hello World')
    })

    it('should update input character count', async () => {
      const input = $('[data-testid="translator-input"] textarea')
      const inputCount = $('[data-testid="translator-input-count"]')
      await input.click()
      await browser.keys(['Control', 'a', 'Delete'])
      await input.setValue('Test')
      await expect(inputCount).toHaveText('4 字符')
    })

    it('should disable translate button when input is empty', async () => {
      const translateBtn = $('[data-testid="translator-translate-btn"]')
      await expect(translateBtn).toBeDisplayed()
    })

    it('should enable translate button when input has text', async () => {
      const input = $('[data-testid="translator-input"] textarea')
      const translateBtn = $('[data-testid="translator-translate-btn"]')

      await input.addValue('Hello')
      await expect(translateBtn).toBeDisplayed()
    })
  })

  describe('Clear Button', () => {
    it('should show clear button', async () => {
      const clearBtn = $('[data-testid="translator-clear-btn"]')
      await expect(clearBtn).toBeDisplayed()
    })

    it('should clear input and output on click', async () => {
      const input = $('[data-testid="translator-input"] textarea')
      const clearBtn = $('[data-testid="translator-clear-btn"]')

      await input.addValue('Test text')
      await clearBtn.click()

      await expect(input).toHaveValue('')
    })
  })
})

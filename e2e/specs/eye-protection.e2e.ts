describe('EyeProtection Module', () => {
  beforeEach(async () => {
    const navBtn = $('[data-testid="nav-eyeProtection"]')
    await navBtn.waitForClickable({ timeout: 5000 })
    await navBtn.click()
    await browser.pause(500)
  })

  describe('Main View', () => {
    it('should display the page title', async () => {
      const title = $('h2=护眼工具')
      await expect(title).toBeDisplayed()
    })

    it('should show statistics cards', async () => {
      const closeStat = $('[data-testid="eye-stat-close"]')
      const restStat = $('[data-testid="eye-stat-rest"]')
      const statusStat = $('[data-testid="eye-stat-status"]')

      await expect(closeStat).toBeDisplayed()
      await expect(restStat).toBeDisplayed()
      await expect(statusStat).toBeDisplayed()
    })

    it('should show config card', async () => {
      const configCard = $('[data-testid="eye-config-card"]')
      await expect(configCard).toBeDisplayed()
    })

    it('should show switch control', async () => {
      const eyeSwitch = $('[data-testid="eye-switch"]')
      await expect(eyeSwitch).toBeDisplayed()
    })
  })

  describe('Switch Control', () => {
    it('should show closed tip when switch is off', async () => {
      const closeInterval = $('[data-testid="eye-close-interval"]')
      if (await closeInterval.isExisting()) {
        const eyeSwitch = $('[data-testid="eye-switch"]')
        await eyeSwitch.click()
        await browser.pause(300)
      }
      const closedTip = $('[data-testid="eye-closed-tip"]')
      await expect(closedTip).toBeDisplayed()
      await expect(closedTip).toHaveText('开启护眼提醒来保护您的眼睛')
    })

    it('should toggle switch on click', async () => {
      const closeInterval = $('[data-testid="eye-close-interval"]')
      if (await closeInterval.isExisting()) {
        const eyeSwitch = $('[data-testid="eye-switch"]')
        await eyeSwitch.click()
        await browser.pause(300)
      }
      const eyeSwitch = $('[data-testid="eye-switch"]')
      await eyeSwitch.click()
      await browser.pause(500)
      const closeIntervalShown = $('[data-testid="eye-close-interval"]')
      await expect(closeIntervalShown).toBeDisplayed()
    })
  })

  describe('Interval Settings', () => {
    beforeEach(async () => {
      const closeInterval = $('[data-testid="eye-close-interval"]')
      if (!(await closeInterval.isExisting())) {
        const eyeSwitch = $('[data-testid="eye-switch"]')
        await eyeSwitch.click()
        await browser.pause(300)
      }
    })

    it('should show close eyes interval input', async () => {
      const closeInterval = $('[data-testid="eye-close-interval"]')
      await expect(closeInterval).toBeDisplayed()
    })

    it('should show rest interval input', async () => {
      const restInterval = $('[data-testid="eye-rest-interval"]')
      await expect(restInterval).toBeDisplayed()
    })

    it('should show restart button', async () => {
      const restartBtn = $('[data-testid="eye-restart-btn"]')
      await expect(restartBtn).toBeDisplayed()
      await expect(restartBtn).toHaveText('重新计时')
    })

    it('should show countdown displays', async () => {
      const closeCountdown = $('[data-testid="eye-close-countdown"]')
      const restCountdown = $('[data-testid="eye-rest-countdown"]')
      await browser.waitUntil(async () => {
        return await closeCountdown.isExisting() && await restCountdown.isExisting()
      }, { timeout: 5000 })
      expect(await closeCountdown.isExisting()).toBe(true)
      expect(await restCountdown.isExisting()).toBe(true)
    })
  })

  describe('Restart Button', () => {
    beforeEach(async () => {
      const closeInterval = $('[data-testid="eye-close-interval"]')
      if (!(await closeInterval.isExisting())) {
        const eyeSwitch = $('[data-testid="eye-switch"]')
        await eyeSwitch.click()
        await browser.pause(300)
      }
    })

    it('should click restart button', async () => {
      const restartBtn = $('[data-testid="eye-restart-btn"]')
      await restartBtn.click()

      await expect(restartBtn).toBeDisplayed()
    })
  })
})

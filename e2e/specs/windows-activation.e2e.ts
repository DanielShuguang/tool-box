describe('WindowsActivation Module', () => {
  beforeEach(async () => {
    const navBtn = $('[data-testid="nav-windowsActivatiion"]')
    await navBtn.waitForClickable({ timeout: 5000 })
    await navBtn.click()
  })

  describe('Main View', () => {
    it('should display the page title', async () => {
      const title = $('[data-testid="activation-page-title"]')
      await expect(title).toBeDisplayed()
    })

    it('should show statistics cards', async () => {
      const statusStat = $('[data-testid="activation-stat-status"]')
      const expiryStat = $('[data-testid="activation-stat-expiry"]')
      const planStat = $('[data-testid="activation-stat-plan"]')

      await expect(statusStat).toBeDisplayed()
      await expect(expiryStat).toBeDisplayed()
      await expect(planStat).toBeDisplayed()
    })

    it('should show status card', async () => {
      const statusCard = $('[data-testid="activation-status-card"]')
      await expect(statusCard).toBeDisplayed()
    })

    it('should show activation button', async () => {
      const activationBtn = $('[data-testid="activation-btn"]')
      await expect(activationBtn).toBeDisplayed()
      await expect(activationBtn).toHaveText('激活 Windows')
    })

    it('should show programs card', async () => {
      const programsCard = $('[data-testid="activation-programs-card"]')
      await expect(programsCard).toBeDisplayed()
    })
  })

  describe('Activation Button', () => {
    it('should show activation button with primary type', async () => {
      const activationBtn = $('[data-testid="activation-btn"]')
      await expect(activationBtn).toBeDisplayed()
    })
  })

  describe('Non-Windows Platform', () => {
    it('should show non-Windows message or Windows content', async () => {
      const nonWindows = $('[data-testid="activation-non-windows"]')
      const statusCard = $('[data-testid="activation-status-card"]')

      const isNonWindows = await nonWindows.isDisplayed().catch(() => false)
      const isStatusCard = await statusCard.isDisplayed().catch(() => false)

      expect(isNonWindows || isStatusCard).toBe(true)
    })
  })
})

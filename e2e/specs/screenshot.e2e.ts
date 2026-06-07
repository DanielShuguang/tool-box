describe('Screenshot Module', () => {
  beforeEach(async () => {
    const navBtn = $('[data-testid="nav-screenshot"]')
    await navBtn.click()
  })

  describe('Main View', () => {
    it('should display the screenshot page title', async () => {
      const title = $('h2=截图工具')
      await expect(title).toBeDisplayed()
    })

    it('should show all three capture mode radio buttons', async () => {
      const group = $('[data-testid="screenshot-mode-group"]')
      await expect(group).toBeDisplayed()

      const fullscreen = $('[data-testid="mode-fullscreen"]')
      const region = $('[data-testid="mode-region"]')
      const window = $('[data-testid="mode-window"]')

      await expect(fullscreen).toBeDisplayed()
      await expect(fullscreen).toHaveText('全屏截图')
      await expect(region).toBeDisplayed()
      await expect(region).toHaveText('区域截图')
      await expect(window).toBeDisplayed()
      await expect(window).toHaveText('窗口截图')
    })

    it('should show capture and open-editor buttons', async () => {
      const captureBtn = $('[data-testid="btn-capture"]')
      await expect(captureBtn).toBeDisplayed()
      await expect(captureBtn).toHaveText('开始截图')

      const editorBtn = $('[data-testid="btn-open-editor"]')
      await expect(editorBtn).toBeDisplayed()
      await expect(editorBtn).toHaveText('打开编辑器')
    })
  })

  describe('Mode Selection', () => {
    it('should default to fullscreen mode', async () => {
      const fullscreen = $('[data-testid="mode-fullscreen"]')
      await expect(fullscreen).toBeDisplayed()
    })

    it('should switch to region mode on click', async () => {
      const region = $('[data-testid="mode-region"]')
      await region.click()
      const captureBtn = $('[data-testid="btn-capture"]')
      await expect(captureBtn).toBeDisplayed()
    })

    it('should switch to window mode on click', async () => {
      const window = $('[data-testid="mode-window"]')
      await window.click()
      const captureBtn = $('[data-testid="btn-capture"]')
      await expect(captureBtn).toBeDisplayed()
    })
  })

  describe('Editor View', () => {
    beforeEach(async () => {
      const editorBtn = $('[data-testid="btn-open-editor"]')
      await editorBtn.click()
    })

    it('should show all 6 tool buttons', async () => {
      const tools = [
        { id: 'tool-pencil', text: '画笔' },
        { id: 'tool-rect', text: '矩形' },
        { id: 'tool-circle', text: '圆形' },
        { id: 'tool-arrow', text: '箭头' },
        { id: 'tool-text', text: '文字' },
        { id: 'tool-mosaic', text: '马赛克' }
      ]

      for (const tool of tools) {
        const btn = $(`[data-testid="${tool.id}"]`)
        await expect(btn).toBeDisplayed()
        await expect(btn).toHaveText(tool.text)
      }
    })

    it('should show undo and redo buttons', async () => {
      const undoBtn = $('[data-testid="btn-undo"]')
      const redoBtn = $('[data-testid="btn-redo"]')

      await expect(undoBtn).toBeDisplayed()
      await expect(undoBtn).toHaveText('撤销')
      await expect(redoBtn).toBeDisplayed()
      await expect(redoBtn).toHaveText('重做')
    })

    it('should show save, copy and close buttons', async () => {
      const saveBtn = $('[data-testid="btn-save"]')
      const copyBtn = $('[data-testid="btn-copy"]')
      const closeBtn = $('[data-testid="btn-close-editor"]')

      await expect(saveBtn).toBeDisplayed()
      await expect(saveBtn).toHaveText('保存')
      await expect(copyBtn).toBeDisplayed()
      await expect(copyBtn).toHaveText('复制')
      await expect(closeBtn).toBeDisplayed()
      await expect(closeBtn).toHaveText('关闭')
    })

    it('should show color picker and line width input', async () => {
      const colorPicker = $('[data-testid="color-picker"]')
      const lineWidthInput = $('[data-testid="line-width-input"]')

      await expect(colorPicker).toBeDisplayed()
      await expect(lineWidthInput).toBeDisplayed()
    })

    it('should show canvas element', async () => {
      const canvas = $('[data-testid="editor-canvas"]')
      await expect(canvas).toBeDisplayed()
    })

    it('should switch tool on click', async () => {
      const rectBtn = $('[data-testid="tool-rect"]')
      await rectBtn.click()

      const circleBtn = $('[data-testid="tool-circle"]')
      await circleBtn.click()

      const pencilBtn = $('[data-testid="tool-pencil"]')
      await pencilBtn.click()
    })

    it('should navigate back to main page from editor', async () => {
      const todoBtn = $('[data-testid="nav-todo"]')
      await todoBtn.click()

      const screenshotBtn = $('[data-testid="nav-screenshot"]')
      await screenshotBtn.click()

      const title = $('h2=截图工具')
      await expect(title).toBeDisplayed()
    })
  })
})

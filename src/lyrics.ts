import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'

interface LyricsEvent {
  event_type: string
  data: any
}

const lyricsText = document.getElementById('lyrics-text') as HTMLElement
const closeBtn = document.getElementById('close-btn') as HTMLElement
const controls = document.querySelector('.controls') as HTMLElement

async function initLyricsWindow() {
  const window = getCurrentWindow()

  closeBtn.addEventListener('click', async () => {
    await invoke('close_lyrics_window')
    await window.close()
  })

  // 监听鼠标离开窗口事件，强制隐藏关闭按钮
  document.addEventListener('mouseleave', () => {
    if (controls) {
      controls.style.display = 'none'
    }
  })

  // 监听鼠标进入窗口事件
  document.addEventListener('mouseenter', () => {
    if (controls) {
      controls.style.display = 'flex'
    }
  })

  await listen<LyricsEvent>('lyrics-event', event => {
    const { event_type, data } = event.payload

    switch (event_type) {
      case 'update-lyrics':
        if (data.text) {
          updateLyricsText(data.text)
        }
        break
      case 'clear-lyrics':
        lyricsText.textContent = '等待歌词...'
        break
      case 'update-style':
        updateStyle(data)
        break
    }
  })
}

let animationFrameId: number | null = null

function updateLyricsText(text: string) {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  animationFrameId = requestAnimationFrame(() => {
    lyricsText.style.transform = 'scale(0.95)'
    lyricsText.style.opacity = '0.8'

    setTimeout(() => {
      lyricsText.textContent = text
      lyricsText.style.transform = 'scale(1)'
      lyricsText.style.opacity = '1'
    }, 100)
  })
}

function updateStyle(style: any) {
  const body = document.body
  if (style.backgroundColor) {
    body.style.background = style.backgroundColor
  }
  if (style.fontSize) {
    lyricsText.style.fontSize = `${style.fontSize}px`
  }
  if (style.fontColor) {
    lyricsText.style.color = style.fontColor
  }
}

initLyricsWindow()

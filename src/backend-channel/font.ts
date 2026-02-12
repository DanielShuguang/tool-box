import { invoke } from '@tauri-apps/api/core'

export interface FontInfo {
  name: string
  path?: string
}

export async function getSystemFonts(): Promise<string[]> {
  try {
    const fonts = await invoke<string[]>('get_system_fonts')
    return fonts
  } catch (err) {
    console.error('获取系统字体失败:', err)
    return getDefaultFonts()
  }
}

function getDefaultFonts(): string[] {
  return [
    'Arial',
    'Arial Black',
    'Arial Narrow',
    'Calibri',
    'Cambria',
    'Comic Sans MS',
    'Consolas',
    'Courier',
    'Courier New',
    'Georgia',
    'Helvetica',
    'Impact',
    'Lucida Console',
    'Microsoft Sans Serif',
    'Segoe UI',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
    'Wingdings',
    '等线',
    '黑体',
    '楷体',
    '隶书',
    '宋体',
    '微软雅黑',
    '新宋体',
    '幼圆'
  ]
}

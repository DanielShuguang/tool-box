/**
 * 系统字体工具
 */

import { getSystemFonts as fetchSystemFonts } from '@/backend-channel/font'

export async function getSystemFonts(): Promise<string[]> {
  try {
    const fonts = await fetchSystemFonts()
    if (fonts && fonts.length > 0) {
      return fonts.sort()
    }
    return getDefaultFonts()
  } catch (err) {
    console.error('获取系统字体失败，使用默认字体列表:', err)
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

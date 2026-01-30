import { describe, it, expect } from 'vitest'
import { excludeFileTypes } from '../binary-file-types'

describe('binaryFileTypes', () => {
  describe('excludeFileTypes', () => {
    it('应该是一个数组', () => {
      expect(Array.isArray(excludeFileTypes)).toBe(true)
    })

    it('应该包含图片类型', () => {
      expect(excludeFileTypes).toContain('png')
      expect(excludeFileTypes).toContain('jpg')
      expect(excludeFileTypes).toContain('jpeg')
      expect(excludeFileTypes).toContain('gif')
      expect(excludeFileTypes).toContain('ico')
      expect(excludeFileTypes).toContain('bmp')
    })

    it('应该包含压缩文件类型', () => {
      expect(excludeFileTypes).toContain('zip')
      expect(excludeFileTypes).toContain('7z')
      expect(excludeFileTypes).toContain('rar')
      expect(excludeFileTypes).toContain('iso')
    })

    it('应该包含可执行文件类型', () => {
      expect(excludeFileTypes).toContain('exe')
    })

    it('应该包含文档类型', () => {
      expect(excludeFileTypes).toContain('pdf')
      expect(excludeFileTypes).toContain('ppt')
    })

    it('应该包含媒体文件类型', () => {
      expect(excludeFileTypes).toContain('mp4')
      expect(excludeFileTypes).toContain('mp3')
      expect(excludeFileTypes).toContain('rmvb')
      expect(excludeFileTypes).toContain('wav')
      expect(excludeFileTypes).toContain('wmv')
      expect(excludeFileTypes).toContain('mkv')
    })

    it('应该不包含常见的文本文件类型', () => {
      expect(excludeFileTypes).not.toContain('txt')
      expect(excludeFileTypes).not.toContain('md')
      expect(excludeFileTypes).not.toContain('json')
      expect(excludeFileTypes).not.toContain('js')
      expect(excludeFileTypes).not.toContain('ts')
      expect(excludeFileTypes).not.toContain('html')
      expect(excludeFileTypes).not.toContain('css')
    })

    it('应该包含所有预期的类型数量', () => {
      expect(excludeFileTypes).toHaveLength(19)
    })

    it('所有元素应该是小写的', () => {
      excludeFileTypes.forEach(type => {
        expect(type).toBe(type.toLowerCase())
      })
    })
  })
})

/**
 * 画布工具函数测试
 */
import { describe, it, expect } from 'vitest'
import { hasCanvasContent, getEmptyCanvasJson } from '../utils/canvasUtils'

describe('canvasUtils', () => {
  describe('hasCanvasContent', () => {
    it('应该返回 false 对于空画布 JSON', () => {
      const emptyCanvasJson = getEmptyCanvasJson()
      expect(hasCanvasContent(emptyCanvasJson)).toBe(false)
    })

    it('应该返回 false 对于无效的 JSON', () => {
      expect(hasCanvasContent('invalid json')).toBe(false)
    })

    it('应该返回 false 对于没有 objects 数组的 JSON', () => {
      const jsonWithoutObjects = JSON.stringify({
        version: '5.3.0',
        background: '#ffffff',
        width: 800,
        height: 600
      })
      expect(hasCanvasContent(jsonWithoutObjects)).toBe(false)
    })

    it('应该返回 false 对于空 objects 数组', () => {
      const jsonWithEmptyObjects = JSON.stringify({
        version: '5.3.0',
        objects: [],
        background: '#ffffff',
        width: 800,
        height: 600
      })
      expect(hasCanvasContent(jsonWithEmptyObjects)).toBe(false)
    })

    it('应该返回 true 对于包含矩形的画布', () => {
      const jsonWithRect = JSON.stringify({
        version: '5.3.0',
        objects: [
          {
            type: 'rect',
            left: 100,
            top: 100,
            width: 200,
            height: 150,
            fill: '#ff0000',
            stroke: '#000000',
            strokeWidth: 2
          }
        ],
        background: '#ffffff',
        width: 800,
        height: 600
      })
      expect(hasCanvasContent(jsonWithRect)).toBe(true)
    })

    it('应该返回 true 对于包含文本的画布', () => {
      const jsonWithText = JSON.stringify({
        version: '5.3.0',
        objects: [
          {
            type: 'text',
            left: 200,
            top: 200,
            text: 'Hello World',
            fontSize: 24,
            fill: '#000000'
          }
        ],
        background: '#ffffff',
        width: 800,
        height: 600
      })
      expect(hasCanvasContent(jsonWithText)).toBe(true)
    })

    it('应该返回 true 对于包含图片的画布', () => {
      const jsonWithImage = JSON.stringify({
        version: '5.3.0',
        objects: [
          {
            type: 'image',
            left: 300,
            top: 300,
            width: 100,
            height: 100,
            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          }
        ],
        background: '#ffffff',
        width: 800,
        height: 600
      })
      expect(hasCanvasContent(jsonWithImage)).toBe(true)
    })

    it('应该返回 false 对于无效的对象类型', () => {
      const jsonWithInvalidObject = JSON.stringify({
        version: '5.3.0',
        objects: [
          {
            // 缺少 type 属性
            left: 100,
            top: 100
          }
        ],
        background: '#ffffff',
        width: 800,
        height: 600
      })
      expect(hasCanvasContent(jsonWithInvalidObject)).toBe(false)
    })

    it('应该返回 false 对于没有有效位置的对象', () => {
      const jsonWithObjectNoPosition = JSON.stringify({
        version: '5.3.0',
        objects: [
          {
            type: 'rect',
            // 缺少 left 和 top
            width: 200,
            height: 150,
            fill: '#ff0000'
          }
        ],
        background: '#ffffff',
        width: 800,
        height: 600
      })
      expect(hasCanvasContent(jsonWithObjectNoPosition)).toBe(false)
    })
  })

  describe('getEmptyCanvasJson', () => {
    it('应该返回有效的空画布 JSON', () => {
      const emptyCanvasJson = getEmptyCanvasJson()
      const parsed = JSON.parse(emptyCanvasJson)

      expect(parsed).toHaveProperty('version')
      expect(parsed).toHaveProperty('objects')
      expect(parsed).toHaveProperty('background')
      expect(parsed).toHaveProperty('width')
      expect(parsed).toHaveProperty('height')

      expect(Array.isArray(parsed.objects)).toBe(true)
      expect(parsed.objects.length).toBe(0)
    })

    it('应该使用自定义参数', () => {
      const emptyCanvasJson = getEmptyCanvasJson(1024, 768, '#000000')
      const parsed = JSON.parse(emptyCanvasJson)

      expect(parsed.width).toBe(1024)
      expect(parsed.height).toBe(768)
      expect(parsed.background).toBe('#000000')
    })
  })
})

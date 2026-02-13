/**
 * 画板类型定义测试
 */
import { describe, it, expect } from 'vitest'
import { DrawingTool, CanvasConfig, ObjectProperties, HistoryState, ExportOptions } from '../types'
import {
  DEFAULT_CANVAS_CONFIG,
  DEFAULT_OBJECT_PROPERTIES,
  MAX_HISTORY_SIZE,
  AUTO_SAVE_INTERVAL,
  SUPPORTED_IMPORT_FORMATS,
  SUPPORTED_EXPORT_FORMATS,
  CANVAS_TOOLBAR_ITEMS,
  PROPERTY_PANEL_ITEMS
} from '../constants'

describe('Canvas Types', () => {
  describe('DrawingTool', () => {
    it('should include all drawing tools', () => {
      const tools: DrawingTool[] = ['select', 'rect', 'circle', 'ellipse', 'line', 'text']

      tools.forEach(tool => {
        expect(['select', 'rect', 'circle', 'ellipse', 'line', 'text']).toContain(tool)
      })
    })
  })

  describe('CanvasConfig', () => {
    it('should have required properties', () => {
      const config: CanvasConfig = {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff'
      }

      expect(config).toHaveProperty('width')
      expect(config).toHaveProperty('height')
      expect(config).toHaveProperty('backgroundColor')
    })
  })

  describe('ObjectProperties', () => {
    it('should have all required properties', () => {
      const props: ObjectProperties = {
        fill: '#000000',
        stroke: '#000000',
        strokeWidth: 2,
        opacity: 1,
        strokeDashArray: []
      }

      expect(props).toHaveProperty('fill')
      expect(props).toHaveProperty('stroke')
      expect(props).toHaveProperty('strokeWidth')
      expect(props).toHaveProperty('opacity')
      expect(props).toHaveProperty('strokeDashArray')
    })

    it('should accept valid color values', () => {
      const props: ObjectProperties = {
        fill: '#ff0000',
        stroke: 'transparent',
        strokeWidth: 5,
        opacity: 0.5,
        strokeDashArray: [5, 5]
      }

      expect(props.fill).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(props.strokeWidth).toBeGreaterThanOrEqual(1)
      expect(props.opacity).toBeLessThanOrEqual(1)
    })
  })

  describe('HistoryState', () => {
    it('should have json and timestamp', () => {
      const state: HistoryState = {
        json: '{"version":"5.3.0","objects":[]}',
        timestamp: Date.now()
      }

      expect(state).toHaveProperty('json')
      expect(state).toHaveProperty('timestamp')
      expect(typeof state.json).toBe('string')
      expect(typeof state.timestamp).toBe('number')
    })
  })

  describe('ExportOptions', () => {
    it('should have correct structure', () => {
      const options: ExportOptions = {
        format: 'png',
        quality: 0.92,
        multiplier: 1
      }

      expect(options).toHaveProperty('format')
      expect(options).toHaveProperty('quality')
      expect(options).toHaveProperty('multiplier')
      expect(['png', 'jpg', 'svg']).toContain(options.format)
    })
  })
})

describe('Canvas Constants', () => {
  describe('DEFAULT_CANVAS_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CANVAS_CONFIG.width).toBe(800)
      expect(DEFAULT_CANVAS_CONFIG.height).toBe(600)
      expect(DEFAULT_CANVAS_CONFIG.backgroundColor).toBe('#ffffff')
    })
  })

  describe('DEFAULT_OBJECT_PROPERTIES', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_OBJECT_PROPERTIES.fill).toBe('#000000')
      expect(DEFAULT_OBJECT_PROPERTIES.stroke).toBe('#000000')
      expect(DEFAULT_OBJECT_PROPERTIES.strokeWidth).toBe(2)
      expect(DEFAULT_OBJECT_PROPERTIES.opacity).toBe(1)
      expect(DEFAULT_OBJECT_PROPERTIES.strokeDashArray).toEqual([])
    })
  })

  describe('MAX_HISTORY_SIZE', () => {
    it('should be within reasonable range', () => {
      expect(MAX_HISTORY_SIZE).toBeGreaterThanOrEqual(20)
      expect(MAX_HISTORY_SIZE).toBeLessThanOrEqual(50)
      expect(MAX_HISTORY_SIZE).toBe(30)
    })
  })

  describe('AUTO_SAVE_INTERVAL', () => {
    it('should be within reasonable range', () => {
      expect(AUTO_SAVE_INTERVAL).toBeGreaterThanOrEqual(1000)
      expect(AUTO_SAVE_INTERVAL).toBeLessThanOrEqual(60000)
      expect(AUTO_SAVE_INTERVAL).toBe(5000)
    })
  })

  describe('SUPPORTED_IMPORT_FORMATS', () => {
    it('should include image formats', () => {
      expect(SUPPORTED_IMPORT_FORMATS).toContain('png')
      expect(SUPPORTED_IMPORT_FORMATS).toContain('jpg')
      expect(SUPPORTED_IMPORT_FORMATS).toContain('jpeg')
      expect(SUPPORTED_IMPORT_FORMATS).toContain('svg')
    })
  })

  describe('SUPPORTED_EXPORT_FORMATS', () => {
    it('should have correct structure', () => {
      expect(SUPPORTED_EXPORT_FORMATS).toHaveLength(3)

      SUPPORTED_EXPORT_FORMATS.forEach(format => {
        expect(format).toHaveProperty('label')
        expect(format).toHaveProperty('value')
        expect(['png', 'jpeg', 'svg']).toContain(format.value)
      })
    })
  })

  describe('CANVAS_TOOLBAR_ITEMS', () => {
    it('should have required toolbar items', () => {
      expect(CANVAS_TOOLBAR_ITEMS).toBeInstanceOf(Array)
      expect(CANVAS_TOOLBAR_ITEMS.length).toBeGreaterThan(0)

      CANVAS_TOOLBAR_ITEMS.forEach(item => {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('type')
        // separator类型不需要icon和tooltip
        if (item.type !== 'separator') {
          expect(item).toHaveProperty('icon')
          expect(item).toHaveProperty('tooltip')
        }
      })
    })
  })

  describe('PROPERTY_PANEL_ITEMS', () => {
    it('should have required property panel items', () => {
      expect(PROPERTY_PANEL_ITEMS).toBeInstanceOf(Array)
      expect(PROPERTY_PANEL_ITEMS.length).toBeGreaterThan(0)

      PROPERTY_PANEL_ITEMS.forEach(item => {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('component')
      })
    })
  })
})

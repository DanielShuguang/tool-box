import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@tauri-apps/plugin-http', () => ({
  fetch: vi.fn()
}))

const { fetch } = await import('@tauri-apps/plugin-http')

describe('request utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('request', () => {
    it('应该是一个函数', async () => {
      const { request } = await import('../request')
      expect(typeof request).toBe('function')
    })

    it('应该返回成功的响应', async () => {
      const { request } = await import('../request')
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ data: 'test' })
      }
      ;(fetch as any).mockResolvedValue(mockResponse)

      const result = await request('https://example.com')

      expect(result).toEqual({ data: 'test' })
      expect(fetch).toHaveBeenCalled()
    })

    it('应该支持自定义 headers', async () => {
      const { request } = await import('../request')
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({})
      }
      ;(fetch as any).mockResolvedValue(mockResponse)

      await request('https://example.com', {
        headers: { 'Custom-Header': 'value' }
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'value',
            'Content-Type': 'application/json'
          })
        })
      )
    })
  })

  describe('get', () => {
    it('应该是一个函数', async () => {
      const { get } = await import('../request')
      expect(typeof get).toBe('function')
    })

    it('应该使用 GET 方法', async () => {
      const { get } = await import('../request')
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({})
      }
      ;(fetch as any).mockResolvedValue(mockResponse)

      await get('https://example.com')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('post', () => {
    it('应该是一个函数', async () => {
      const { post } = await import('../request')
      expect(typeof post).toBe('function')
    })

    it('应该使用 POST 方法', async () => {
      const { post } = await import('../request')
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({})
      }
      ;(fetch as any).mockResolvedValue(mockResponse)

      await post('https://example.com', { key: 'value' })

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('应该序列化请求体', async () => {
      const { post } = await import('../request')
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({})
      }
      ;(fetch as any).mockResolvedValue(mockResponse)

      await post('https://example.com', { key: 'value' })

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ key: 'value' })
        })
      )
    })
  })

  describe('put', () => {
    it('应该是一个函数', async () => {
      const { put } = await import('../request')
      expect(typeof put).toBe('function')
    })

    it('应该使用 PUT 方法', async () => {
      const { put } = await import('../request')
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({})
      }
      ;(fetch as any).mockResolvedValue(mockResponse)

      await put('https://example.com', { key: 'value' })

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  describe('del', () => {
    it('应该是一个函数', async () => {
      const { del } = await import('../request')
      expect(typeof del).toBe('function')
    })

    it('应该使用 DELETE 方法', async () => {
      const { del } = await import('../request')
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({})
      }
      ;(fetch as any).mockResolvedValue(mockResponse)

      await del('https://example.com')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})

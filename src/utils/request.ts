import { fetch } from '@tauri-apps/plugin-http'

interface RequestOptions {
  /** 超时时间，单位毫秒 */
  timeout?: number
  /** 重试次数 */
  retries?: number
  /** 重试延迟时间，单位毫秒 */
  retryDelay?: number
  /** 自定义错误处理 */
  onError?: (error: Error) => void
  /** HTTP请求头 */
  headers?: Record<string, string>
  /** HTTP请求方法 */
  method?: string
  /** 请求体 */
  body?: BodyInit
  /** 响应类型 */
  responseType?: ResponseType
}

interface RequestError extends Error {
  status?: number
  statusText?: string
  url?: string
}

/**
 * 创建一个请求错误
 */
function createRequestError(
  message: string,
  response?: { status: number; statusText?: string; url?: string }
): RequestError {
  const error: RequestError = new Error(message)
  if (response) {
    error.status = response.status
    error.statusText = response.statusText
    error.url = response.url
  }
  return error
}

/**
 * 延迟执行
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 超时控制
 */
function timeoutPromise<T = any>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(createRequestError(`请求超时 ${ms}ms`))
      }, ms)
    })
  ])
}

/**
 * 通用请求方法
 */
export async function request<T = any>(
  url: string | URL,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeout = 10000,
    retries = 0,
    retryDelay = 1000,
    onError,
    headers = {},
    method = 'GET',
    body,
    responseType = 'json'
  } = options

  let lastError: Error | null = null

  // 重试机制
  for (let i = 0; i <= retries; i++) {
    try {
      // 超时控制
      const response = await timeoutPromise(
        fetch(url.toString(), {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body
        }),
        timeout
      )

      // 处理非2xx响应
      if (!response.ok) {
        throw createRequestError(`请求失败: ${response.status} ${response.statusText}`, response)
      }

      return (responseType === 'json' ? response.json() : response.text()) as Promise<T>
    } catch (error) {
      lastError = error as Error

      // 自定义错误处理
      onError?.(lastError)

      // 是否还有重试机会
      if (i < retries) {
        // 延迟重试
        await delay(retryDelay)
        continue
      }

      throw lastError
    }
  }

  // 不应该到达这里
  throw lastError || new Error('未知错误')
}

/**
 * GET请求
 */
export function get<T = any>(url: string | URL, options?: RequestOptions): Promise<T> {
  return request<T>(url, { ...options, method: 'GET' })
}

/**
 * POST请求
 */
export function post<T = any>(url: string | URL, data?: any, options?: RequestOptions): Promise<T> {
  return request<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * PUT请求
 */
export function put<T = any>(url: string | URL, data?: any, options?: RequestOptions): Promise<T> {
  return request<T>(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * DELETE请求
 */
export function del<T = any>(url: string | URL, options?: RequestOptions): Promise<T> {
  return request<T>(url, { ...options, method: 'DELETE' })
}

import { get, post } from '@/utils/request'
import { MessageApiInjection } from 'naive-ui/es/message/src/MessageProvider'

// 翻译服务接口
interface TranslationService {
  translate(text: string, from: string, to: string): Promise<string>
}

// Google翻译服务
class GoogleTranslation implements TranslationService {
  private readonly baseUrl = 'https://translate.googleapis.com/translate_a/single'

  constructor(private message: MessageApiInjection) {}

  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      const url = new URL(this.baseUrl)
      url.searchParams.append('client', 'gtx')
      url.searchParams.append('sl', from === 'auto' ? 'auto' : from.toLowerCase())
      url.searchParams.append('tl', to.toLowerCase())
      url.searchParams.append('dt', 't')
      url.searchParams.append('q', text)

      const result = await get(url, {
        timeout: 15000,
        onError: error => {
          const msg = error.message || error.toString()
          this.message.error(msg)
          throw new Error(msg)
        }
      })

      // Google翻译返回的是一个嵌套数组，第一个元素包含翻译结果
      const translations = result[0]
      return translations.map((t: any[]) => t[0]).join('')
    } catch (error) {
      console.error('Google翻译出错:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('翻译服务异常，请稍后重试')
    }
  }
}

// DeepL翻译服务
class DeepLTranslation implements TranslationService {
  private readonly baseUrl = 'https://dplx.xi-xu.me/deepl'

  constructor(private message: MessageApiInjection) {}

  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      const result = await post(
        this.baseUrl,
        {
          text,
          source_lang: from.toUpperCase(),
          target_lang: to.toUpperCase()
        },
        {
          timeout: 15000,
          onError: error => {
            const msg = error.message || error.toString()
            this.message.error(msg)
            throw new Error(msg)
          }
        }
      )

      return result.data
    } catch (error) {
      console.error('DeepL翻译出错:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('翻译服务异常，请稍后重试')
    }
  }
}

// 翻译服务工厂
export class TranslationFactory {
  static getService(type: 'google' | 'deepl', message: MessageApiInjection): TranslationService {
    switch (type) {
      case 'google':
        return new GoogleTranslation(message)
      case 'deepl':
        return new DeepLTranslation(message)
      default:
        throw new Error('不支持的翻译服务')
    }
  }
}

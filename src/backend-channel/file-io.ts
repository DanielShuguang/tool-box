import { open, save } from '@tauri-apps/plugin-dialog'
import { readFile, writeFile } from '@tauri-apps/plugin-fs'
import { invoke } from '@tauri-apps/api/core'

export interface CheckFileExistsPayload extends Record<string, unknown> {
  filePath: string
}

export async function checkFileExists(payload: CheckFileExistsPayload): Promise<boolean> {
  try {
    return await invoke('check_file_exists', payload)
  } catch (err) {
    console.error('检查文件存在性失败:', err)
    return false
  }
}

export async function saveFile(
  content: string,
  defaultName: string,
  filters: Array<{ name: string; extensions: string[] }>
) {
  try {
    const filePath = await save({
      defaultPath: defaultName,
      filters
    })

    if (filePath) {
      const encoder = new TextEncoder()
      const uint8Array = encoder.encode(content)
      await writeFile(filePath, uint8Array)
      return filePath
    }
    return null
  } catch (err: any) {
    console.error('保存文件失败:', err)
    throw new Error(`保存文件失败: ${err}`)
  }
}

export async function readFileContent(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath)
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(content as Uint8Array)
  } catch (err: any) {
    console.error('读取文件失败:', err)
    throw new Error(`读取文件失败: ${err}`)
  }
}

export async function selectImportFile(
  filters: Array<{ name: string; extensions: string[] }>
): Promise<string | null> {
  try {
    const filePath = await open({
      multiple: false,
      filters
    })

    if (typeof filePath === 'string') {
      return filePath
    }
    return null
  } catch (err) {
    console.error('选择文件失败:', err)
    return null
  }
}

/**
 * 选择导出目录
 * @returns 选择的目录路径
 */
export async function selectExportDirectory(): Promise<string | null> {
  try {
    const dirPath = await open({
      directory: true,
      multiple: false,
      title: '选择导出目录'
    })

    if (typeof dirPath === 'string') {
      return dirPath
    }
    return null
  } catch (err) {
    console.error('选择目录失败:', err)
    return null
  }
}

export async function checkPathExists(filePath: string): Promise<boolean> {
  try {
    const normalizedPath = filePath.replace(/\\/g, '/')
    console.log(`检查路径: ${normalizedPath}`)
    const pathExists = await checkFileExists({ filePath: normalizedPath })
    console.log(`路径存在: ${pathExists}`)
    return pathExists
  } catch (err) {
    console.error(`检查路径失败: ${filePath}`, err)
    return false
  }
}

export async function batchCheckPaths(filePaths: string[]): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>()

  for (const filePath of filePaths) {
    result.set(filePath, await checkPathExists(filePath))
  }

  return result
}

/**
 * 删除文件
 * @param filePath 文件路径
 * @returns 是否删除成功
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    return await invoke('delete_file', { filePath })
  } catch (err) {
    console.error('删除文件失败:', err)
    return false
  }
}

/**
 * 读取二进制文件内容
 * @param filePath 文件路径
 * @returns 二进制文件内容
 */
export async function readBinaryFile(filePath: string): Promise<Uint8Array> {
  try {
    const content = await readFile(filePath)
    return content as Uint8Array
  } catch (err: any) {
    console.error('读取二进制文件失败:', err)
    throw new Error(`读取二进制文件失败: ${err}`)
  }
}

/**
 * 保存二进制文件
 * @param content 二进制文件内容
 * @param defaultName 默认文件名
 * @param filters 文件过滤器
 * @returns 保存的文件路径
 */
export async function saveBinaryFile(
  content: Uint8Array | ArrayBuffer,
  defaultName: string,
  filters: Array<{ name: string; extensions: string[] }>
) {
  try {
    const filePath = await save({
      defaultPath: defaultName,
      filters
    })

    if (filePath) {
      // 确保 content 是 Uint8Array 类型
      const data = content instanceof ArrayBuffer ? new Uint8Array(content) : content
      await writeFile(filePath, data)
      return filePath
    }
    return null
  } catch (err: any) {
    console.error('保存二进制文件失败:', err)
    throw new Error(`保存二进制文件失败: ${err}`)
  }
}

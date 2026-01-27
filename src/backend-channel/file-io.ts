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

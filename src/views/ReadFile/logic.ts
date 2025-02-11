import { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import { excludeFileTypes } from '@/utils/binary-file-types'
import { UploadFileInfo, UploadSettledFileInfo } from 'naive-ui'
import { isString } from 'radash'
import { useRuntimeEvent } from '@/hooks/useRuntimeEvent'
import { getCpuCoreCount } from '@/backend-channel/utils'
import { downloadFile } from '@/backend-channel/download'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { open } from '@tauri-apps/plugin-dialog'
import mammoth from 'mammoth'
import XLSX from 'xlsx'

export function useUpdateSavingDir() {
  const dirPath = ref('')

  async function selectSavingDir() {
    const res = await open({ directory: true, multiple: false })
    if (isString(res)) {
      dirPath.value = res
    }
  }

  return { dirPath, selectSavingDir }
}

export function useManageRegexSelect() {
  const regText = ref('')
  const selectedReg = ref<string | null>(null)

  const regList: SelectMixedOption[] = [
    { label: '图片', value: '(https|http)://.*\\.(jpg|png|jpeg|gif)' },
    { label: '视频', value: '(https|http)://.*\\.(mp4|rmvb|mkv|avi)' },
    { label: '软件', value: '(https|http)://.*\\.(exe|msi)' },
    { label: '压缩包', value: '(https|http)://.*\\.(zip|7z|rar|iso)' }
  ]

  function handleSelect(v: string) {
    regText.value = v
    selectedReg.value = v
  }

  return { regText, selectedReg, regList, handleSelect }
}

// 分析受支持的二进制文件内容
function useAnalysisBinaryFile(getMatchContent: (text: string) => void) {
  const message = useMessage()

  // 读取 excel 内容
  async function readExcelContent(file: File) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheets = workbook.SheetNames
      const content = sheets.reduce((pre, sheet) => {
        const worksheet = workbook.Sheets[sheet]
        const data = XLSX.utils.sheet_to_txt(worksheet)
        return `${pre}\n${data}`
      }, '')
      getMatchContent(content)
    } catch (err) {
      message.error(err as any)
    }
  }

  // 读取 word 文档内容
  async function readWordDocContent(file: File) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const { value } = await mammoth.extractRawText({ arrayBuffer })
      getMatchContent(value)
    } catch (err) {
      message.error(err as any)
    }
  }

  return { readExcelContent, readWordDocContent }
}

export function useAnalysisFileContent(regText: Ref<string>, dirPath: Ref<string>) {
  const message = useMessage()
  const isUrl = ref(false)

  const fileList = shallowRef<UploadFileInfo[]>([])
  const searched = shallowRef<string[]>([])

  function handleSelectFile(files: UploadSettledFileInfo[]) {
    fileList.value = files.slice(-1)

    const isBinary = excludeFileTypes.some(fileType =>
      fileList.value[0].file?.name.endsWith(`.${fileType}`)
    )
    isBinary && message.warning('文件不是正常文本文件格式，可能会读取失败', { duration: 5000 })
  }

  // 获取匹配内容
  function getMatchContent(text: string) {
    const reg = new RegExp(regText.value, 'ig')
    const contents = Array.from(text.match(reg) || [])
    searched.value = contents
    removeDuplicates()
    checkContentIsUrl()
    message.success(`分析完成，存在${searched.value.length}条可用数据`, { duration: 5000 })
  }

  const { readExcelContent, readWordDocContent } = useAnalysisBinaryFile(getMatchContent)

  // 分析文件内容
  function analysisContent() {
    const currentFile = fileList.value[0]
    const file = currentFile.file
    if (!file) return

    if (['doc', 'docx'].some(type => file.name.endsWith(`.${type}`))) {
      return readWordDocContent(file)
    } else if (['xls', 'xlsx'].some(type => file.name.endsWith(`.${type}`))) {
      return readExcelContent(file)
    }
    readNormalTextContent(file)
  }

  // 读取普通文本文件内容
  async function readNormalTextContent(file: File) {
    try {
      const text = await file.text()
      getMatchContent(text)
    } catch (err) {
      message.error(err as any)
    }
  }

  // 检查内容是否为 url
  function checkContentIsUrl() {
    isUrl.value = false
    if (!searched.value.length) return

    if (regText.value.includes('http') || regText.value.includes('www.')) {
      isUrl.value = true
    }
  }

  // 去重
  function removeDuplicates() {
    if (!searched.value.length) return

    searched.value = [...new Set(searched.value)]
  }

  async function saveToFile() {
    await writeTextFile(`${dirPath.value}/searched-result.txt`, searched.value.join('\n'))
    message.success('导出完成')
  }

  return { fileList, searched, isUrl, saveToFile, analysisContent, handleSelectFile }
}

export enum DownloadStatus {
  Default = 'default',
  Processing = 'processing',
  Shutdown = 'Shutdown'
}

export function useManageDownloader(searched: Ref<string[]>, dirPath: Ref<string>) {
  const message = useMessage()
  const { concurrentCount } = useDownloadConcurrent()

  const downloadStatus = ref(DownloadStatus.Default)
  const downloadCount = ref(0)
  const maxDownloadCount = ref(5)

  async function handleDownload() {
    const reqs: Promise<any>[] = []
    downloadStatus.value = DownloadStatus.Processing
    downloadCount.value = 0
    for (const url of searched.value) {
      if (downloadStatus.value !== DownloadStatus.Processing) {
        await Promise.allSettled(reqs)
        message.info('已停止下载')
        downloadStatus.value = DownloadStatus.Default
        return
      }

      const downFn = downloadFile({
        concurrent: concurrentCount.value,
        dir_path: dirPath.value,
        url
      }).then(({ code }) => {
        code === 200 && downloadCount.value++
        const i = reqs.findIndex(f => f === downFn)
        reqs.splice(i, 1)
      })
      reqs.push(downFn)

      if (reqs.length >= maxDownloadCount.value) {
        await Promise.any(reqs)
      }
    }

    await Promise.allSettled(reqs)

    message.success('下载完成')
    downloadStatus.value = DownloadStatus.Default
  }

  function stopDownload() {
    message.info('操作成功，在已有任务完成后将停止下载')
    downloadStatus.value = DownloadStatus.Shutdown
  }

  return {
    downloadStatus,
    downloadCount,
    concurrentCount,
    maxDownloadCount,
    handleDownload,
    stopDownload
  }
}

export function useDownloadConcurrent() {
  const concurrentCount = ref(5)

  onMounted(async () => {
    const cores = await getCpuCoreCount()
    if (cores) {
      concurrentCount.value = Math.floor(cores / 2)
    }
  })

  return { concurrentCount }
}

export function useBackendOutput() {
  const outputs = ref<string[]>([])
  const outputRef = ref<HTMLDivElement>()

  const updateOutputScroll = useDebounceFn(() => {
    if (!outputRef.value) return

    outputRef.value.scrollTop = outputRef.value.scrollHeight
  }, 200)

  useRuntimeEvent<string>('download-output', ({ payload }) => {
    outputs.value.push(payload)
    if (outputs.value.length > 100) {
      outputs.value.shift()
    }

    updateOutputScroll()
  })

  function clearOutputs() {
    outputs.value.length = 0
  }

  return { outputs, outputRef, clearOutputs }
}

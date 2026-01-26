import { cancelSearchTask, searchHarddiskFile } from '@/backend-channel/file-search'
import { getHarddiskInfo } from '@/backend-channel/utils'
import { useRuntimeEvent } from '@/hooks/useRuntimeEvent'
import { uniqBy } from 'lodash-es'
import { useDownloadConcurrent } from '../ReadFile/logic'
import Big from 'big.js'
import { platform } from '@tauri-apps/plugin-os'
import { Command } from '@tauri-apps/plugin-shell'
import { Nullable } from '@/types/common'

export function useInitDisk() {
  const selectedPoint = ref<string[]>([])
  const diskMountPoints = ref<string[]>([])
  const selectAll = ref(false)

  async function getDiskMountPoints() {
    try {
      const disks = await getHarddiskInfo()
      diskMountPoints.value = disks.sort((a, b) => (a > b ? 1 : -1))
    } catch (error) {
      console.error(error)
    }
  }

  getDiskMountPoints()

  watch(selectAll, val => {
    if (val) {
      selectedPoint.value = [...diskMountPoints.value]
    } else {
      selectedPoint.value = []
    }
  })

  watch(
    () => selectedPoint.value.length,
    length => {
      selectAll.value = length === diskMountPoints.value.length
    }
  )

  return { diskMountPoints, selectedPoint, selectAll }
}

export enum SearchStatus {
  Default = 'default',
  Processing = 'processing',
  Shutdown = 'Shutdown'
}

interface ResultFileModel {
  path: string
  size: string
  isDir: boolean
}

export function useSearchFile(selectedPoint: Ref<string[]>) {
  const searchText = ref('')
  const searchResult = ref<ResultFileModel[]>([])
  const taskStatus = ref(SearchStatus.Default)
  const supportFolder = ref(false)

  const { concurrentCount } = useDownloadConcurrent()

  function handleSearch() {
    searchResult.value = []
    taskStatus.value = SearchStatus.Processing

    searchHarddiskFile({
      name: searchText.value,
      disks: selectedPoint.value,
      concurrent: concurrentCount.value
    })
  }

  useRuntimeEvent<Nullable<ResultFileModel[]>>('search-disk-file-output', async ({ payload }) => {
    if (!payload) {
      taskStatus.value = SearchStatus.Shutdown
      setTimeout(() => {
        taskStatus.value = SearchStatus.Default
      }, 500)
      return
    }
    if (taskStatus.value === SearchStatus.Shutdown) {
      return
    }

    const list = supportFolder.value ? payload : payload.filter(item => !item.isDir)
    // 兼容 windows 路径中盘符的双斜杠
    const formatData = list.map(el => ({ ...el, path: el.path.replaceAll('\\\\', '\\') }))
    searchResult.value.push(...formatData)
    searchResult.value = uniqBy(searchResult.value, el => el.path)
  })

  const renderItems = useThrottle(searchResult, 500, true)

  function handleStopSearchTask() {
    taskStatus.value = SearchStatus.Shutdown
    cancelSearchTask()
  }

  function clearResult() {
    searchResult.value.length = 0
  }

  return {
    searchText,
    concurrentCount,
    searchResult,
    renderItems,
    supportFolder,
    taskStatus,
    clearResult,
    handleSearch,
    handleStopSearchTask
  }
}

/**
 * 去掉小数点后多余的 0
 * @param numStr
 * @returns
 */
function removeTrailingZero(numStr: string): string {
  numStr = numStr.replace(/\.?0+$/, '')
  return numStr
}

/**
 * 获取正确的文件大小，最大单位为 GB
 * @param size 字节大小
 */
export function getCorrectSize(size: string) {
  const sizeObj = Big(size)
  const gbOffset = Big(1024).pow(3)
  const mbOffset = Big(1024).pow(2)
  const kbOffset = 1024

  if (sizeObj.gt(gbOffset)) {
    return `${removeTrailingZero(sizeObj.div(gbOffset).toFixed(2))} GB`
  } else if (sizeObj.gt(mbOffset)) {
    return `${removeTrailingZero(sizeObj.div(mbOffset).toFixed(2))} MB`
  } else if (sizeObj.gt(kbOffset)) {
    return `${removeTrailingZero(sizeObj.div(kbOffset).toFixed(2))} KB`
  }
  return `${removeTrailingZero(sizeObj.toFixed(2))} B`
}

/**
 * 使用操作系统自带的文件浏览器打开指定文件或目录
 *
 * 该钩子函数提供了在不同操作系统(Windows, Mac, Linux)中打开文件或目录的功能
 * 它根据操作系统类型调用相应的函数来实现此功能
 */
export function useViewFileInExplorer() {
  const message = useMessage()

  function openInExplorer(file: ResultFileModel) {
    const os = platform()
    if (os === 'windows') {
      return windowsOpener(file)
    } else if (os === 'macos') {
      return macOpener(file)
    } else if (os === 'linux') {
      return linuxOpener(file)
    }

    message.error('暂不支持该操作系统')
  }

  function windowsOpener(file: ResultFileModel) {
    try {
      return Command.create('explorer', `/select,${file.path}`).execute()
    } catch (error) {
      message.error(String(error))
    }
  }

  function macOpener(file: ResultFileModel) {
    try {
      return Command.create('open', `-R ${file.path}`).execute()
    } catch (error) {
      message.error(String(error))
    }
  }

  /**
   * 在Linux系统中打开文件或文件夹，Linux不支持在文件夹中高亮选中
   *
   * 此函数根据文件或文件夹的路径，在Linux系统中使用`xdg-open`命令进行打开
   * 如果是文件夹，则直接打开；如果是文件，则打开其所在文件夹
   *
   * @param file 一个包含文件或文件夹信息的ResultFileModel实例
   */
  function linuxOpener(file: ResultFileModel) {
    try {
      // 判断是否为文件夹
      if (file.isDir) {
        // 直接使用xdg-open命令打开文件夹
        return Command.create('xdg-open', file.path).execute()
      }
      // 对于文件，先提取其所在路径
      const pathList = file.path.split(/(\\|\/)/)
      // 移除文件名，得到文件夹路径
      pathList.pop()
      if (!pathList.length) return message.error('文件路径错误')

      // 使用xdg-open命令打开文件所在文件夹
      return Command.create('xdg-open', `${pathList.join('/')}`).execute()
    } catch (error) {
      // 捕获并显示错误信息
      message.error(String(error))
    }
  }

  return { openInExplorer }
}

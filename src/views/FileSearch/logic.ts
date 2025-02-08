import { cancelSearchTask, searchHarddiskFile } from '@/backend-channel/file-search'
import { getHarddiskInfo } from '@/backend-channel/utils'
import { useRuntimeEvent } from '@/hooks/useRuntimeEvent'
import { uniqWith } from 'lodash-es'
import { useDownloadConcurrent } from '../ReadFile/logic'

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
  is_dir: boolean
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

  useRuntimeEvent<ResultFileModel[] | null>('search-disk-file-output', async ({ payload }) => {
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

    const list = supportFolder.value ? payload : payload.filter(item => !item.is_dir)
    searchResult.value.push(...list)
    searchResult.value = uniqWith(searchResult.value, (a, b) => a.path === b.path)
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

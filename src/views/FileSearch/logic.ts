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
      diskMountPoints.value = disks
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
  size: number
  type: 'file' | 'dir'
}

export function useSearchFile(selectedPoint: Ref<string[]>) {
  const searchText = ref('')
  const searchResult = ref<ResultFileModel[]>([])
  const taskStatus = ref(SearchStatus.Default)

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

    searchResult.value.push(...payload)
    searchResult.value = uniqWith(searchResult.value, (a, b) => a.path === b.path)
  })

  const renderItems = useDebounce(searchResult, 500)

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
    taskStatus,
    clearResult,
    handleSearch,
    handleStopSearchTask
  }
}

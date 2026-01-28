import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DownloadTask, DownloadStatus } from '@/views/Download/types'
import {
  formatFileSize,
  formatSpeed,
  formatTime,
  formatDate,
  calculateProgressPercentage,
  calculateETA,
  getTaskById,
  filterDownloadingTasks,
  filterCompletedTasks,
  searchTasks,
  getStatusType,
  getStatusText,
  formatSpeedLimitLabel,
  speedLimitMBToBytes,
  speedLimitBytesToMB
} from '@/utils/download'

describe('Download 工具函数', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('formatFileSize', () => {
    it('应该正确格式化 0 B', () => {
      expect(formatFileSize(0)).toBe('0 B')
    })

    it('应该正确格式化 Bytes', () => {
      expect(formatFileSize(512)).toBe('512 B')
      expect(formatFileSize(1023)).toBe('1023 B')
    })

    it('应该正确格式化 KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('应该正确格式化 MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB')
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
    })

    it('应该正确格式化 GB', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2 GB')
    })
  })

  describe('formatSpeed', () => {
    it('应该添加 /s 后缀', () => {
      expect(formatSpeed(1024)).toBe('1 KB/s')
      expect(formatSpeed(1024 * 1024)).toBe('1 MB/s')
    })

    it('应该正确格式化 0 速度', () => {
      expect(formatSpeed(0)).toBe('0 B/s')
    })
  })

  describe('formatTime', () => {
    it('应该返回 -- 当时间为 0', () => {
      expect(formatTime(0)).toBe('--')
    })

    it('应该正确格式化秒', () => {
      expect(formatTime(30)).toBe('30秒')
      expect(formatTime(59)).toBe('59秒')
    })

    it('应该正确格式化分秒', () => {
      expect(formatTime(60)).toBe('1分0秒')
      expect(formatTime(90)).toBe('1分30秒')
      expect(formatTime(3599)).toBe('59分59秒')
    })

    it('应该正确格式化时分', () => {
      expect(formatTime(3600)).toBe('1时0分')
      expect(formatTime(3661)).toBe('1时1分')
      expect(formatTime(7200)).toBe('2时0分')
    })
  })

  describe('formatDate', () => {
    it('应该返回 -- 当时间戳为 null', () => {
      expect(formatDate(null)).toBe('--')
    })

    it('应该返回 -- 当时间戳为 undefined', () => {
      expect(formatDate(undefined as unknown as null)).toBe('--')
    })

    it('应该正确格式化时间戳', () => {
      const timestamp = new Date('2024-01-15 10:30:00').getTime()
      const result = formatDate(timestamp)
      expect(result).toContain('2024')
      expect(result).toContain('01')
      expect(result).toContain('15')
    })
  })

  describe('calculateProgressPercentage', () => {
    it('应该返回 0 当 totalBytes 为 0', () => {
      expect(calculateProgressPercentage(0, 0)).toBe(0)
    })

    it('应该正确计算 50%', () => {
      expect(calculateProgressPercentage(512000, 1024000)).toBe(50)
    })

    it('应该正确计算 25%', () => {
      expect(calculateProgressPercentage(256000, 1024000)).toBe(25)
    })

    it('应该正确计算 100%', () => {
      expect(calculateProgressPercentage(1024000, 1024000)).toBe(100)
    })

    it('应该正确处理边界值', () => {
      expect(calculateProgressPercentage(1, 100)).toBe(1)
    })
  })

  describe('calculateETA', () => {
    it('应该返回 0 当速度为 0', () => {
      expect(calculateETA(512000, 1024000, 0)).toBe(0)
    })

    it('应该返回 0 当下载完成', () => {
      expect(calculateETA(1024000, 1024000, 102400)).toBe(0)
    })

    it('应该正确计算 ETA', () => {
      expect(calculateETA(512000, 1024000, 102400)).toBe(5)
    })

    it('应该正确处理高速', () => {
      expect(calculateETA(512000, 1024000, 1024 * 1024)).toBe(1)
    })
  })

  describe('getTaskById', () => {
    it('应该返回找到的任务', () => {
      const tasks = [
        { id: '1', name: 'task1' },
        { id: '2', name: 'task2' }
      ]
      expect(getTaskById(tasks, '1')).toEqual({ id: '1', name: 'task1' })
    })

    it('应该返回 undefined 当未找到', () => {
      const tasks = [{ id: '1', name: 'task1' }]
      expect(getTaskById(tasks, '999')).toBeUndefined()
    })

    it('应该正确处理空数组', () => {
      expect(getTaskById([], '1')).toBeUndefined()
    })
  })

  describe('filterDownloadingTasks', () => {
    it('应该过滤 pending, downloading, paused 状态', () => {
      const tasks: DownloadTask[] = [
        createMockTask({ id: '1', status: 'pending' }),
        createMockTask({ id: '2', status: 'downloading' }),
        createMockTask({ id: '3', status: 'paused' }),
        createMockTask({ id: '4', status: 'completed' }),
        createMockTask({ id: '5', status: 'failed' })
      ]

      const result = filterDownloadingTasks(tasks)
      expect(result).toHaveLength(3)
      expect(result.map(t => t.id)).toEqual(['1', '2', '3'])
    })

    it('应该正确处理空数组', () => {
      expect(filterDownloadingTasks([])).toHaveLength(0)
    })
  })

  describe('filterCompletedTasks', () => {
    it('应该过滤 completed, failed, cancelled 状态', () => {
      const tasks: DownloadTask[] = [
        createMockTask({ id: '1', status: 'pending' }),
        createMockTask({ id: '2', status: 'completed' }),
        createMockTask({ id: '3', status: 'failed' }),
        createMockTask({ id: '4', status: 'cancelled' }),
        createMockTask({ id: '5', status: 'downloading' })
      ]

      const result = filterCompletedTasks(tasks)
      expect(result).toHaveLength(3)
      expect(result.map(t => t.id)).toEqual(['2', '3', '4'])
    })
  })

  describe('searchTasks', () => {
    it('应该返回原数组当关键词为空', () => {
      const tasks = [createMockTask({ id: '1' }), createMockTask({ id: '2' })]
      expect(searchTasks(tasks, '')).toEqual(tasks)
      expect(searchTasks(tasks, '  ')).toEqual(tasks)
    })

    it('应该通过 URL 过滤', () => {
      const tasks = [
        createMockTask({ id: '1', url: 'https://example.com/file1.zip', fileName: 'file1.zip' }),
        createMockTask({ id: '2', url: 'https://other.com/file.zip', fileName: 'file.zip' })
      ]

      expect(searchTasks(tasks, 'example')).toHaveLength(1)
      expect(searchTasks(tasks, 'example')[0].id).toBe('1')
    })

    it('应该通过文件名过滤', () => {
      const tasks = [
        createMockTask({ id: '1', url: 'https://example.com/file.zip', fileName: 'doc.pdf' }),
        createMockTask({ id: '2', url: 'https://example.com/file.zip', fileName: 'image.jpg' })
      ]

      expect(searchTasks(tasks, 'image')).toHaveLength(1)
      expect(searchTasks(tasks, 'image')[0].id).toBe('2')
    })

    it('应该不区分大小写', () => {
      // 测试大小写不敏感搜索
      expect(
        searchTasks([{ url: 'https://EXAMPLE.com/file.zip', fileName: 'file.zip' }], 'example')
      ).toHaveLength(1)
      expect(
        searchTasks([{ url: 'https://example.com/file.zip', fileName: 'FILE.ZIP' }], 'EXAMPLE')
      ).toHaveLength(1)
    })
  })

  describe('getStatusType', () => {
    it('应该返回 downloading 对应 info', () => {
      expect(getStatusType('downloading')).toBe('info')
    })

    it('应该返回 completed 对应 success', () => {
      expect(getStatusType('completed')).toBe('success')
    })

    it('应该返回 failed 对应 error', () => {
      expect(getStatusType('failed')).toBe('error')
    })

    it('应该返回 paused 对应 warning', () => {
      expect(getStatusType('paused')).toBe('warning')
    })

    it('应该返回其他状态对应 default', () => {
      expect(getStatusType('pending')).toBe('default')
    })
  })

  describe('getStatusText', () => {
    it('应该返回中文状态文本', () => {
      expect(getStatusText('pending')).toBe('等待中')
      expect(getStatusText('downloading')).toBe('下载中')
      expect(getStatusText('paused')).toBe('已暂停')
      expect(getStatusText('completed')).toBe('已完成')
      expect(getStatusText('failed')).toBe('下载失败')
      expect(getStatusText('cancelled')).toBe('已取消')
    })

    it('应该返回未知状态为原文', () => {
      expect(getStatusText('unknown')).toBe('unknown')
    })
  })

  describe('formatSpeedLimitLabel', () => {
    it('应该返回不限速当 limit 为 null', () => {
      expect(formatSpeedLimitLabel(null)).toBe('不限速')
    })

    it('应该返回不限速当 limit 为 0', () => {
      expect(formatSpeedLimitLabel(0)).toBe('不限速')
    })

    it('应该正确格式化 MB/s', () => {
      expect(formatSpeedLimitLabel(5 * 1024 * 1024)).toBe('5.0 MB/s')
      expect(formatSpeedLimitLabel(2.5 * 1024 * 1024)).toBe('2.5 MB/s')
    })

    it('应该正确格式化 KB/s', () => {
      expect(formatSpeedLimitLabel(1024)).toBe('1 KB/s')
      expect(formatSpeedLimitLabel(512 * 1024)).toBe('512 KB/s')
    })
  })

  describe('speedLimitMBToBytes', () => {
    it('应该返回 null 当输入为空', () => {
      expect(speedLimitMBToBytes(null)).toBeNull()
      expect(speedLimitMBToBytes('')).toBeNull()
    })

    it('应该返回 null 当输入为 0', () => {
      expect(speedLimitMBToBytes(0)).toBeNull()
      expect(speedLimitMBToBytes('0')).toBeNull()
    })

    it('应该正确转换', () => {
      expect(speedLimitMBToBytes(1)).toBe(1024 * 1024)
      expect(speedLimitMBToBytes('1')).toBe(1024 * 1024)
      expect(speedLimitMBToBytes(5.5)).toBe(Math.round(5.5 * 1024 * 1024))
    })
  })

  describe('speedLimitBytesToMB', () => {
    it('应该返回空字符串当输入为 null', () => {
      expect(speedLimitBytesToMB(null)).toBe('')
    })

    it('应该返回空字符串当输入为 0', () => {
      expect(speedLimitBytesToMB(0)).toBe('')
    })

    it('应该正确转换', () => {
      expect(speedLimitBytesToMB(1024 * 1024)).toBe('1.00')
      expect(speedLimitBytesToMB(5 * 1024 * 1024)).toBe('5.00')
    })
  })
})

// 辅助函数：创建模拟任务
function createMockTask(overrides: Partial<DownloadTask> = {}): DownloadTask {
  return {
    id: 'test-id-1',
    url: 'https://example.com/file.zip',
    fileName: 'file.zip',
    saveDir: 'C:/Downloads',
    savePath: 'C:/Downloads/file.zip',
    status: 'pending' as DownloadStatus,
    progress: {
      downloadedBytes: 0,
      totalBytes: 1024000,
      speed: 0,
      percentage: 0,
      eta: 0
    },
    downloadedBytes: 0,
    totalBytes: 1024000,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    speedLimit: null,
    retryCount: 0,
    responseCode: null,
    etag: null,
    lastModified: null,
    ...overrides
  }
}

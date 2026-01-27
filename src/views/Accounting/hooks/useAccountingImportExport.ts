import { useAccountingStore } from '@/stores/accounting'
import { AccountingRecord } from '../types'
import * as XLSX from 'xlsx'
import {
  saveFile,
  selectImportFile,
  readFileContent,
  readBinaryFile,
  saveBinaryFile
} from '@/backend-channel/file-io'
import { useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'

// 导入导出相关逻辑
export function useAccountingImportExport() {
  const accountingStore = useAccountingStore()
  const message = useMessage()
  const { categories, records } = storeToRefs(accountingStore)

  // 获取所有记账记录（用于导出）
  const getAllRecords = async (): Promise<AccountingRecord[]> => {
    try {
      // 加载第一页记录
      await accountingStore.loadRecords(1, 1000, {})
      return records.value
    } catch (error) {
      console.error('获取所有记录失败:', error)
      throw error
    }
  }

  // 导出数据为 JSON 格式
  const exportAsJSON = async () => {
    try {
      const records = await getAllRecords()
      const exportData = {
        records,
        categories: categories.value
      }
      const jsonContent = JSON.stringify(exportData, null, 2)

      const fileName = `accounting_${new Date().toISOString().slice(0, 10)}.json`
      await saveFile(jsonContent, fileName, [{ name: 'JSON Files', extensions: ['json'] }])

      message.success('导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      message.error('导出失败')
    }
  }

  // 导出数据为 XLSX 格式
  const exportAsXLSX = async () => {
    try {
      const records = await getAllRecords()

      // 转换记录数据为表格格式
      const recordsData = records.map(record => ({
        ID: record.id,
        类型: record.type === 'income' ? '收入' : '支出',
        分类: getCategoryName(record.category, record.type),
        金额: record.amount,
        日期: new Date(record.date).toLocaleDateString('zh-CN'),
        备注: record.note || ''
      }))

      // 转换分类数据为表格格式
      const categoriesData = categories.value.map((category: any) => ({
        ID: category.id,
        名称: category.name,
        类型: category.type === 'income' ? '收入' : '支出',
        图标: category.icon || ''
      }))

      // 创建工作簿
      const wb = XLSX.utils.book_new()

      // 创建工作表
      const recordsWS = XLSX.utils.json_to_sheet(recordsData)
      const categoriesWS = XLSX.utils.json_to_sheet(categoriesData)

      // 添加表头筛选功能
      // 记账记录工作表 - 只给类型和分类列添加筛选
      if (recordsData.length > 0) {
        // 类型列是B列，分类列是C列
        recordsWS['!autofilter'] = { ref: 'B1:C1' }
      }

      // 分类信息工作表 - 只给类型列添加筛选
      if (categoriesData.length > 0) {
        // 类型列是C列
        categoriesWS['!autofilter'] = { ref: 'C1:C1' }
      }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, recordsWS, '记账记录')
      XLSX.utils.book_append_sheet(wb, categoriesWS, '分类信息')

      // 生成二进制数据
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

      // 保存文件
      const fileName = `accounting_${new Date().toISOString().slice(0, 10)}.xlsx`
      await saveBinaryFile(excelBuffer, fileName, [{ name: 'Excel Files', extensions: ['xlsx'] }])
      message.success('导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      message.error('导出失败')
    }
  }

  // 导出数据
  const exportData = async (format: 'json' | 'xlsx') => {
    if (format === 'json') {
      await exportAsJSON()
    } else {
      await exportAsXLSX()
    }
  }

  // 导入数据
  const importData = async () => {
    try {
      // 选择文件
      const filePath = await selectImportFile([
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'Excel Files', extensions: ['xlsx'] }
      ])

      if (!filePath) return

      // 检查文件扩展名
      const isJSON = filePath.endsWith('.json')
      const isXLSX = filePath.endsWith('.xlsx')

      if (isJSON) {
        // 导入 JSON 文件
        const content = await readFileContent(filePath)
        const importData = JSON.parse(content)

        // 导入记录
        if (importData.records && Array.isArray(importData.records)) {
          let importedCount = 0
          let skippedCount = 0

          for (const record of importData.records) {
            // 检查记录是否已存在
            if (record.id) {
              try {
                const existingRecord = await accountingStore.getRecordById(record.id)
                if (existingRecord) {
                  // 记录已存在，跳过
                  skippedCount++
                  continue
                }
                // eslint-disable-next-line no-unused-vars
              } catch (error) {
                // 记录不存在，继续添加
              }
            }

            // 添加新记录
            await accountingStore.addRecord({
              amount: record.amount,
              type: record.type,
              category: record.category,
              date: record.date,
              note: record.note
            })
            importedCount++
          }

          // 显示导入结果
          if (importedCount > 0) {
            message.success(
              `导入成功，新增 ${importedCount} 条记录，跳过 ${skippedCount} 条重复记录`
            )
          } else if (skippedCount > 0) {
            message.info(`所有记录已存在，跳过 ${skippedCount} 条重复记录`)
          }
        }

        // 导入分类（如果有）
        if (importData.categories && Array.isArray(importData.categories)) {
          for (const category of importData.categories) {
            accountingStore.addCategory({
              name: category.name,
              type: category.type,
              icon: category.icon
            })
          }
        }
      } else if (isXLSX) {
        // 导入 XLSX 文件
        const content = await readBinaryFile(filePath)
        const wb = XLSX.read(content, { type: 'array' })

        // 读取记账记录工作表
        const recordsSheet = wb.Sheets['记账记录']
        if (recordsSheet) {
          const recordsData = XLSX.utils.sheet_to_json(recordsSheet)

          // 转换并导入记录
          let importedCount = 0
          let skippedCount = 0

          for (const item of recordsData) {
            // 查找对应的分类 ID
            let categoryId = ''
            const typedItem = item as Record<string, any>
            const categoryName = typedItem.分类 as string
            const type = (typedItem.类型 as string) === '收入' ? 'income' : 'expense'

            // 检查记录是否已存在
            if (typedItem.ID) {
              try {
                const existingRecord = await accountingStore.getRecordById(typedItem.ID as string)
                if (existingRecord) {
                  // 记录已存在，跳过
                  skippedCount++
                  continue
                }
                // eslint-disable-next-line no-unused-vars
              } catch (error) {
                // 记录不存在，继续添加
              }
            }

            // 查找分类
            const category = categories.value.find(
              (cat: any) => cat.name === categoryName && cat.type === type
            )

            if (category) {
              categoryId = category.id
            } else {
              // 如果找不到分类，使用其他类型
              categoryId = `${type}-other`
            }

            // 转换日期为时间戳
            const dateStr = typedItem.日期 as string
            const date = new Date(dateStr)
            const timestamp = date.getTime()

            // 导入记录
            await accountingStore.addRecord({
              amount: typedItem.金额 as number,
              type,
              category: categoryId,
              date: timestamp,
              note: (typedItem.备注 as string) || ''
            })
            importedCount++
          }

          // 显示导入结果
          if (importedCount > 0) {
            message.success(
              `导入成功，新增 ${importedCount} 条记录，跳过 ${skippedCount} 条重复记录`
            )
          } else if (skippedCount > 0) {
            message.info(`所有记录已存在，跳过 ${skippedCount} 条重复记录`)
          }
        }

        // 读取分类信息工作表
        const categoriesSheet = wb.Sheets['分类信息']
        if (categoriesSheet) {
          const categoriesData = XLSX.utils.sheet_to_json(categoriesSheet)

          // 导入分类
          for (const item of categoriesData) {
            const typedItem = item as Record<string, any>
            const type = (typedItem.类型 as string) === '收入' ? 'income' : 'expense'

            // 检查分类是否已存在
            const existingCategory = categories.value.find(
              (cat: any) => cat.name === typedItem.名称 && cat.type === type
            )

            if (!existingCategory) {
              accountingStore.addCategory({
                name: typedItem.名称 as string,
                type,
                icon: (typedItem.图标 as string) || ''
              })
            }
          }
        }
      } else {
        message.error('不支持的文件格式')
      }
    } catch (error) {
      console.error('导入失败:', error)
      message.error('导入失败')
    }
  }

  // 根据ID获取分类名称
  const getCategoryName = (categoryId: string, type: 'income' | 'expense') => {
    const category = categories.value.find((cat: any) => cat.id === categoryId && cat.type === type)
    return category?.name || '未分类'
  }

  return {
    exportData,
    importData
  }
}

import { ConfigFile } from '@/utils/storage'
import { generateId } from '@/utils/id'
import type {
  Option,
  PickTarget,
  PickResult,
  PickMode,
  PickerConfig
} from '@/views/RandomPicker/types/picker'

/** 确保是数组格式 */
function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) return value
  return []
}

export const useRandomPickerStore = defineStore(
  'randomPicker',
  () => {
    /** 候选项列表 */
    const options = ref<Option[]>([])

    /** 选择目标列表（顺序选择模式） */
    const targets = ref<PickTarget[]>([])

    /** 选择配置 */
    const config = ref<PickerConfig>({
      removeSelected: true
    })

    /** 选择历史 */
    const history = ref<PickResult[]>([])

    /** 当前选择模式 */
    const mode = ref<PickMode>('normal')

    /** 普通选择数量 */
    const pickCount = ref(1)

    /** 已选中的 ID 列表（使用数组以支持持久化） */
    const selectedIds = ref<string[]>([])

    // ========== 候选项管理 ==========

    /** 添加候选项 */
    function addOption(name: string, weight = 1, group?: string): Option {
      const option: Option = {
        id: generateId(),
        name: name.trim(),
        weight,
        disabled: false,
        group
      }
      options.value.push(option)
      return option
    }

    /** 批量添加候选项 */
    function addOptions(names: string[]): Option[] {
      return names
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .map(name => addOption(name))
    }

    /** 更新候选项 */
    function updateOption(id: string, updates: Partial<Option>): void {
      const index = options.value.findIndex(opt => opt.id === id)
      if (index !== -1) {
        options.value[index] = { ...options.value[index], ...updates }
      }
    }

    /** 删除候选项 */
    function removeOption(id: string): void {
      options.value = options.value.filter(opt => opt.id !== id)
      selectedIds.value = ensureArray(selectedIds.value).filter(sid => sid !== id)
    }

    /** 批量删除候选项 */
    function removeOptions(ids: string[]): void {
      const idSet = new Set(ids)
      options.value = options.value.filter(opt => !idSet.has(opt.id))
      selectedIds.value = ensureArray(selectedIds.value).filter(sid => !idSet.has(sid))
    }

    /** 切换禁用状态 */
    function toggleDisabled(id: string): void {
      const option = options.value.find(opt => opt.id === id)
      if (option) {
        option.disabled = !option.disabled
      }
    }

    /** 批量禁用 */
    function setDisabled(ids: string[], disabled: boolean): void {
      const idSet = new Set(ids)
      options.value.forEach(opt => {
        if (idSet.has(opt.id)) {
          opt.disabled = disabled
        }
      })
    }

    /** 清除所有禁用状态 */
    function clearAllDisabled(): void {
      options.value.forEach(opt => {
        opt.disabled = false
      })
    }

    /** 清空所有候选项 */
    function clearOptions(): void {
      options.value = []
      selectedIds.value = []
    }

    // ========== 选择目标管理 ==========

    /** 添加选择目标 */
    function addTarget(name: string, count: number): PickTarget {
      const target: PickTarget = {
        id: generateId(),
        name,
        count,
        order: targets.value.length
      }
      targets.value.push(target)
      return target
    }

    /** 更新选择目标 */
    function updateTarget(id: string, updates: Partial<PickTarget>): void {
      const index = targets.value.findIndex(t => t.id === id)
      if (index !== -1) {
        targets.value[index] = { ...targets.value[index], ...updates }
      }
    }

    /** 删除选择目标 */
    function removeTarget(id: string): void {
      targets.value = targets.value.filter(t => t.id !== id)
      // 重新排序
      targets.value.forEach((t, index) => {
        t.order = index
      })
    }

    /** 清空选择目标 */
    function clearTargets(): void {
      targets.value = []
    }

    // ========== 选择操作 ==========

    /** 检查是否已选中 */
    function isSelected(id: string): boolean {
      return ensureArray(selectedIds.value).includes(id)
    }

    /** 获取有效候选项（未禁用且未被选中） */
    function getAvailableOptions(): Option[] {
      return options.value.filter(opt => {
        if (opt.disabled) return false
        if (config.value.removeSelected && isSelected(opt.id)) return false
        return true
      })
    }

    /** 执行普通选择 */
    function pickNormal(count: number): Option[] {
      const available = getAvailableOptions()
      const actualCount = Math.min(count, available.length)

      // Fisher-Yates 洗牌算法
      const shuffled = [...available]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      return shuffled.slice(0, actualCount)
    }

    /** 执行权重选择 */
    function pickWeighted(count: number): Option[] {
      const available = getAvailableOptions()
      const actualCount = Math.min(count, available.length)
      const result: Option[] = []
      const remaining = [...available]

      for (let i = 0; i < actualCount && remaining.length > 0; i++) {
        // 计算总权重
        const totalWeight = remaining.reduce((sum, opt) => sum + opt.weight, 0)
        let random = Math.random() * totalWeight

        // 根据权重选择
        for (let j = 0; j < remaining.length; j++) {
          random -= remaining[j].weight
          if (random <= 0) {
            result.push(remaining[j])
            remaining.splice(j, 1)
            break
          }
        }
      }

      return result
    }

    /** 执行选择 */
    function performPick(count?: number): Option[] {
      const actualCount = count ?? pickCount.value

      let selected: Option[]
      if (mode.value === 'weighted') {
        selected = pickWeighted(actualCount)
      } else {
        selected = pickNormal(actualCount)
      }

      // 记录结果
      if (selected.length > 0) {
        const result: PickResult = {
          id: generateId(),
          timestamp: Date.now(),
          mode: mode.value,
          selected,
          config: { ...config.value }
        }
        history.value.unshift(result)

        // 标记已选中
        if (config.value.removeSelected) {
          const ids = ensureArray(selectedIds.value)
          selected.forEach(opt => {
            if (!ids.includes(opt.id)) {
              ids.push(opt.id)
            }
          })
          selectedIds.value = ids
        }
      }

      return selected
    }

    /** 执行顺序选择（选择特定目标） */
    function performSequentialPick(target: PickTarget): Option[] {
      let selected: Option[]
      if (mode.value === 'weighted') {
        selected = pickWeighted(target.count)
      } else {
        selected = pickNormal(target.count)
      }

      // 记录结果
      if (selected.length > 0) {
        const result: PickResult = {
          id: generateId(),
          timestamp: Date.now(),
          mode: mode.value,
          target,
          selected,
          config: { ...config.value }
        }
        history.value.unshift(result)

        // 标记已选中
        if (config.value.removeSelected) {
          const ids = ensureArray(selectedIds.value)
          selected.forEach(opt => {
            if (!ids.includes(opt.id)) {
              ids.push(opt.id)
            }
          })
          selectedIds.value = ids
        }
      }

      return selected
    }

    /** 撤销最近一次选择 */
    function undoLastPick(): PickResult | null {
      if (history.value.length === 0) return null

      const lastResult = history.value.shift()!

      // 恢复已选中状态
      if (lastResult.config.removeSelected) {
        const idsToRemove = new Set(lastResult.selected.map(opt => opt.id))
        selectedIds.value = ensureArray(selectedIds.value).filter(id => !idsToRemove.has(id))
      }

      return lastResult
    }

    /** 清空历史 */
    function clearHistory(): void {
      history.value = []
    }

    /** 重置已选中状态 */
    function resetSelected(): void {
      selectedIds.value = []
    }

    // ========== 计算属性 ==========

    /** 有效候选项数量 */
    const availableCount = computed(() => getAvailableOptions().length)

    /** 是否可以进行选择 */
    const canPick = computed(() => getAvailableOptions().length > 0)

    /** 已选中数量 */
    const selectedCount = computed(() => ensureArray(selectedIds.value).length)

    return {
      // 状态
      options,
      targets,
      config,
      history,
      mode,
      pickCount,
      selectedIds,

      // 计算属性
      availableCount,
      canPick,
      selectedCount,

      // 候选项管理
      addOption,
      addOptions,
      updateOption,
      removeOption,
      removeOptions,
      toggleDisabled,
      setDisabled,
      clearAllDisabled,
      clearOptions,

      // 选择目标管理
      addTarget,
      updateTarget,
      removeTarget,
      clearTargets,

      // 选择操作
      getAvailableOptions,
      isSelected,
      performPick,
      performSequentialPick,
      undoLastPick,
      clearHistory,
      resetSelected
    }
  },
  {
    persist: {
      fileName: ConfigFile.Settings,
      key: 'randomPicker'
    }
  }
)

<script lang="ts" setup>
import { format } from 'date-fns'
import {
  OpenOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  KeyOutline
} from '@vicons/ionicons5'
import {
  activationPrograms,
  useActivateWindows,
  useActivationInfo,
  useCheckCurrentActivation
} from './logic'
import { open } from '@tauri-apps/plugin-shell'

const { activeState, textColor } = useActivationInfo()

const { isWindows } = useCheckCurrentActivation(activeState)

const { loading, handleClick } = useActivateWindows(activeState)

function gotoDownload(link: string) {
  open(link)
}

// 统计数据
const statusLabel = computed(() => {
  if (activeState.value === 0) return '未激活'
  if (activeState.value === 1) return '已激活'
  // activeState > 1 表示 KMS 时间戳
  const remaining = activeState.value - Date.now()
  const remainingDays = remaining / (1000 * 60 * 60 * 24)
  if (remainingDays <= 60) return '即将过期'
  return '已激活'
})

const statusColor = computed(() => {
  if (activeState.value === 1) return 'text-green-500'
  if (activeState.value === 0) return 'text-red-500'
  return 'text-orange-500'
})

// KMS 剩余天数
const remainingDays = computed(() => {
  if (activeState.value > 1) {
    return Math.ceil((activeState.value - Date.now()) / (1000 * 60 * 60 * 24))
  }
  return 0
})

// 是否即将过期（剩余 <= 60 天）
const isExpiringSoon = computed(() => {
  return activeState.value > 1 && remainingDays.value <= 60
})
</script>

<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <!-- 页面标题 -->
    <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0">
      <h2 class="text-lg font-semibold">Windows 激活</h2>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 overflow-auto p-4">
      <!-- 非 Windows 提示 -->
      <div v-if="!isWindows" class="flex items-center justify-center h-full">
        <n-empty description="请在 Windows 下使用本功能" />
      </div>

      <template v-else>
        <!-- 统计卡片 -->
        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <div class="flex items-center gap-2">
              <n-icon size="20" :class="statusColor">
                <CheckmarkCircleOutline v-if="activeState === 1 || (activeState > 1 && !isExpiringSoon)" />
                <CloseCircleOutline v-else-if="activeState === 0" />
                <KeyOutline v-else />
              </n-icon>
              <div>
                <div class="text-xs text-gray-500">激活状态</div>
                <div class="text-sm font-bold" :class="statusColor">
                  {{ statusLabel }}
                </div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <div class="flex items-center gap-2">
              <n-icon size="20" class="text-blue-500">
                <KeyOutline />
              </n-icon>
              <div>
                <div class="text-xs text-gray-500">到期时间</div>
                <div class="text-sm font-bold">
                  {{ activeState > 1 ? format(activeState, 'yyyy-MM-dd') : 'N/A' }}
                </div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <div class="flex items-center gap-2">
              <n-icon size="20" class="text-purple-500">
                <KeyOutline />
              </n-icon>
              <div>
                <div class="text-xs text-gray-500">激活方案</div>
                <div class="text-sm font-bold">KMS 180天</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 激活状态卡片 -->
        <n-card :bordered="false" class="mb-4">
          <template #header>
            <div class="flex items-center gap-2">
              <span class="text-base font-medium">当前状态</span>
            </div>
          </template>

          <div class="flex items-center gap-4 mb-4">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="{
                'bg-green-100': activeState === 1 || (activeState > 1 && !isExpiringSoon),
                'bg-red-100': activeState === 0,
                'bg-orange-100': activeState > 1 && isExpiringSoon
              }">
              <n-icon size="24" :class="statusColor">
                <CheckmarkCircleOutline v-if="activeState === 1" />
                <CloseCircleOutline v-else-if="activeState === 0" />
                <KeyOutline v-else />
              </n-icon>
            </div>
            <div>
              <div v-if="activeState > 1" class="flex items-center gap-2">
                <span :class="textColor" class="text-lg font-semibold">
                  {{ format(activeState, 'yyyy-MM-dd') }}
                </span>
                <n-tag v-if="isExpiringSoon" type="warning" size="small">即将过期</n-tag>
              </div>
              <span v-else-if="activeState === 1" class="text-lg font-semibold text-green-500">
                已永久激活
              </span>
              <span v-else class="text-lg font-semibold text-red-500">未激活</span>
              <div class="text-sm text-gray-400 mt-1">
                {{
                  activeState > 1
                    ? '剩余 ' + remainingDays + ' 天'
                    : '点击下方按钮激活'
                }}
              </div>
            </div>
          </div>

          <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div class="text-sm text-orange-700">
              <p class="mb-1">请确认本应用使用管理员权限打开</p>
              <p>本程序基于 KMS 提供 180 天激活，到期需重新激活</p>
            </div>
          </div>

          <template #footer>
            <div class="flex items-center">
              <n-popconfirm @positive-click="handleClick">
                <template #trigger>
                  <n-button type="primary" :loading="loading">激活 Windows</n-button>
                </template>
                此次激活非永久激活！如已有可用的激活码或已永久激活，请谨慎使用本功能。
              </n-popconfirm>
            </div>
          </template>
        </n-card>

        <!-- 更多方案 -->
        <n-card :bordered="false">
          <template #header>
            <span class="text-base font-medium">更多方案</span>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="program in activationPrograms"
              :key="program.title"
              class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
              @click="gotoDownload(program.link)">
              <div class="flex items-start justify-between">
                <div>
                  <div class="text-sm font-medium text-gray-700 mb-1">
                    {{ program.title }}
                  </div>
                  <div class="text-xs text-gray-400 leading-relaxed">
                    {{ program.description }}
                  </div>
                </div>
                <n-button size="small" @click.stop="gotoDownload(program.link)">
                  <template #icon>
                    <n-icon><OpenOutline /></n-icon>
                  </template>
                </n-button>
              </div>
            </div>
          </div>
        </n-card>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.n-card {
  background-color: var(--cardColor);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.bg-white {
  background-color: var(--cardColor);
}
</style>

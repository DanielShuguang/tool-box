<script lang="ts" setup>
import { format } from 'date-fns'
import { OpenOutline } from '@vicons/ionicons5'
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
</script>

<template>
  <div class="flex flex-col h-full gap-3 overflow-hidden">
    <!-- 非 Windows 提示 -->
    <div v-if="!isWindows" class="flex items-center justify-center h-full">
      <n-empty description="请在 Windows 下使用本功能" />
    </div>

    <template v-else>
      <!-- 激活状态 -->
      <div class="config-card">
        <p class="section-title">激活状态</p>
        <div class="flex items-center gap-3">
          <span
            class="status-dot"
            :class="{
              'bg-[--successColor]': activeState === 1,
              'bg-[--errorColor]': activeState === 0,
              [textColor.replace('text-', 'bg-')]: activeState > 1
            }" />
          <span v-if="activeState > 1" class="text-[13px]">
            <span :class="textColor" class="font-semibold">
              {{ format(activeState, 'yyyy-MM-dd') }}
            </span>
            <span class="text-[--textColor2] ml-1">到期</span>
          </span>
          <span
            v-else-if="activeState === 1"
            class="text-[13px] font-semibold text-[--successColor]">
            已永久激活
          </span>
          <span v-else class="text-[13px] font-semibold text-[--errorColor]">未激活</span>
        </div>
        <div class="hint-text">
          <p>请确认本应用使用管理员权限打开</p>
          <p>本程序基于 KMS 提供 180 天激活，到期需重新激活。永久激活请参考下方"更多方案"</p>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="flex items-center">
        <n-popconfirm @positive-click="handleClick">
          <template #trigger>
            <n-button type="primary" :loading="loading">激活 Windows</n-button>
          </template>
          此次激活非永久激活！如已有可用的激活码或已永久激活，请谨慎使用本功能。
        </n-popconfirm>
      </div>

      <!-- 更多方案 -->
      <div class="config-card">
        <p class="section-title">更多方案</p>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="program in activationPrograms" :key="program.title" class="program-card">
            <div class="text-[13px] font-medium text-[--textColorBase] mb-1">
              {{ program.title }}
            </div>
            <div class="text-[11px] text-[--textColor3] mb-3 leading-relaxed">
              {{ program.description }}
            </div>
            <n-button size="small" @click="gotoDownload(program.link)">
              <template #icon>
                <n-icon><OpenOutline /></n-icon>
              </template>
              前往下载
            </n-button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.config-card {
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  padding: 14px 16px;
  background-color: var(--cardColor);
  flex-shrink: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--textColor3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 10px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.hint-text {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--dividerColor);
  font-size: 11px;
  color: var(--textColor3);
  line-height: 1.6;

  p {
    margin: 0;
  }
}

.program-card {
  border: 1px solid var(--borderColor);
  border-radius: 6px;
  padding: 12px;
  background-color: var(--actionColor);
  transition: border-color 0.15s ease;

  &:hover {
    border-color: var(--primaryColor);
  }
}
</style>

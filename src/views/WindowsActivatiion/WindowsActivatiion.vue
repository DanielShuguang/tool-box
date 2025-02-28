<script lang="ts" setup>
import dayjs from 'dayjs'
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
  <div>
    <n-alert v-if="!isWindows" type="warning">请在 Windows 下使用本功能</n-alert>
    <template v-else>
      <n-card>
        <n-alert class="mb-[15px]" type="info">
          <div>请确认本应用使用管理员权限打开。</div>
          <div>
            本程序只能提供180天的激活（基于KMS），到期需要重新激活。永久激活可以使用“更多方案”中提供的工具
          </div>
        </n-alert>
        <n-text>
          <span v-if="activeState > 1">
            <span :class="textColor">
              {{ dayjs.unix(activeState).format('YYYY-MM-DD') }}
            </span>
            到期
          </span>
          <span v-else-if="activeState === 1" class="text-[--successColor]">已永久激活</span>
          <span v-else class="text-[--errorColor]">未激活</span>
        </n-text>
      </n-card>
      <n-popconfirm @positive-click="handleClick">
        <template #trigger>
          <n-button class="mt-[15px]" type="primary" :loading="loading">激活</n-button>
        </template>
        此次激活非永久激活！如已有可用的激活码或已永久激活，请谨慎使用本功能。
      </n-popconfirm>
    </template>

    <n-card class="mt-[15px]">
      <n-collapse>
        <n-collapse-item title="更多方案" name="more">
          <div v-for="program in activationPrograms" :key="program.title">
            <h2>{{ program.title }}</h2>
            <div>{{ program.description }}</div>
            <n-button @click="gotoDownload(program.link)">前往下载</n-button>
          </div>
        </n-collapse-item>
      </n-collapse>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useActivateWindows, useActivationInfo, useCheckCurrentActivation } from './logic'

const { activeState, textColor } = useActivationInfo()

const { isWindows } = useCheckCurrentActivation(activeState)

const { loading, handleClick } = useActivateWindows(activeState)
</script>

<template>
  <div>
    <n-alert v-if="!isWindows" type="warning">请在 Windows 下使用本功能</n-alert>
    <template v-else>
      <n-card>
        <n-alert class="mb-[15px]" type="info">
          <div>请确认本应用使用管理员权限打开。</div>
          <div>本程序只能提供180天的激活（基于KMS），到期需要重新激活。</div>
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
      <n-button class="mt-[15px]" type="primary" :loading="loading" @click="handleClick">
        激活
      </n-button>
    </template>
  </div>
</template>

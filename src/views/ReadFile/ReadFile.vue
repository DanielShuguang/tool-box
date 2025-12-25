<script lang="ts" setup>
import { ArchiveOutline } from '@vicons/ionicons5'
import {
  DownloadStatus,
  useAnalysisFileContent,
  useBackendOutput,
  useManageDownloader,
  useManageRegexSelect,
  useUpdateSavingDir
} from './logic'

const { dirPath, selectSavingDir } = useUpdateSavingDir()

const { regList, regText, selectedReg, handleSelect } = useManageRegexSelect()

const { fileList, searched, isUrl, analysisContent, handleSelectFile, saveToFile } =
  useAnalysisFileContent(regText, dirPath)

const { outputs, outputRef, clearOutputs } = useBackendOutput()

const {
  downloadStatus,
  concurrentCount,
  maxDownloadCount,
  downloadCount,
  handleDownload,
  stopDownload
} = useManageDownloader(searched, dirPath)
</script>

<template>
  <div class="flex flex-col">
    <n-upload :file-list="fileList" @update:file-list="handleSelectFile">
      <n-upload-dragger>
        <div class="mb-[12px]">
          <n-icon size="48" :depth="3">
            <ArchiveOutline />
          </n-icon>
        </div>
        <n-text class="text-[16px]">点击或者拖动文件到该区域</n-text>
      </n-upload-dragger>
    </n-upload>

    <n-form label-placement="left">
      <n-form-item required label="输入查询的正则表达式">
        <n-input v-model:value="regText" @update:value="selectedReg = null" />
        <n-select
          placeholder="预制正则列表"
          :value="selectedReg"
          class="w-[200px]"
          :options="regList"
          @update:value="handleSelect" />
      </n-form-item>

      <n-form-item required label="保存目录">
        <n-input
          :value="dirPath"
          placeholder="请选择文件夹路径"
          :input-props="{ class: 'cursor-pointer' }"
          readonly
          @click="selectSavingDir" />
      </n-form-item>
      <n-form-item label="同时下载任务数">
        <n-input-number
          v-model:value="maxDownloadCount"
          :min="1"
          :disabled="downloadStatus === DownloadStatus.Processing" />
      </n-form-item>
      <n-form-item label="单个任务的下载线程数">
        <n-input-number
          v-model:value="concurrentCount"
          :min="1"
          :disabled="downloadStatus === DownloadStatus.Processing" />
        <span class="ml-[15px]">下载线程越多，理论下载速度越快，请根据电脑配置合理设置</span>
      </n-form-item>
    </n-form>

    <div class="flex justify-between items-center mb-[10px]">
      <div class="flex items-center h-[40px]">
        <n-button
          class="mr-[10px]"
          type="primary"
          :disabled="!regText || !fileList.length"
          @click="analysisContent">
          读取匹配内容
        </n-button>
        <n-button
          v-if="searched.length"
          class="mr-[10px]"
          :disabled="!dirPath"
          type="primary"
          @click="saveToFile">
          导出到文件
        </n-button>
        <template v-if="isUrl && searched.length">
          <n-button
            v-if="![DownloadStatus.Processing, DownloadStatus.Shutdown].includes(downloadStatus)"
            class="mr-[10px]"
            type="primary"
            @click="handleDownload">
            开始下载
          </n-button>
          <n-button
            v-else
            :loading="downloadStatus === DownloadStatus.Shutdown"
            class="mr-[10px]"
            type="primary"
            @click="stopDownload">
            停止下载
          </n-button>
        </template>
      </div>

      <span v-if="searched.length">已下载：{{ downloadCount }}；总共：{{ searched.length }}</span>
    </div>

    <div
      ref="outputRef"
      class="relative flex-1 box-border bg-[--avatarColor] border-(1px solid) border-[--borderColor] p-[10px] overflow-auto">
      <n-button
        v-show="outputs.length"
        class="sticky float-right left-[100%] top-0"
        size="small"
        type="primary"
        @click="clearOutputs">
        清空
      </n-button>
      <p v-for="(m, i) of outputs" :key="i" class="my-[2px] w-[calc(100%-55px)] break-words">
        {{ m }}
      </p>
    </div>
  </div>
</template>

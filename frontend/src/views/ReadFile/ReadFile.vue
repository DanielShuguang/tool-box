<script lang="ts" setup>
import { ArchiveOutline } from '@vicons/ionicons5'
import {
  useAnalysisFileContent,
  useBackendOutput,
  useManageDownloader,
  useManageRegexSelect,
  useUpdateSavingDir
} from './logic'
import { NInputNumber } from 'naive-ui'

const { dirPath, selectSavingDir } = useUpdateSavingDir()

const { regList, regText, selectedReg, handleSelect } = useManageRegexSelect()

const { fileList, searched, isUrl, analysisContent, handleSelectFile, saveToFile } =
  useAnalysisFileContent(regText, dirPath)

const { outputs, outputRef, clearOutputs } = useBackendOutput()

const {
  isDownloading,
  concurrentCount,
  maxDownloadCount,
  downloadCount,
  handleDownload,
  stopDownload
} = useManageDownloader(searched, dirPath)
</script>

<template>
  <div class="flex flex-col size-full">
    <NUpload :file-list="fileList" @update:file-list="handleSelectFile">
      <NUploadDragger>
        <div class="mb-[12px]">
          <NIcon size="48" :depth="3">
            <ArchiveOutline />
          </NIcon>
        </div>
        <NText class="text-[16px]">点击或者拖动文件到该区域</NText>
      </NUploadDragger>
    </NUpload>

    <NForm label-placement="left">
      <NFormItem required label="输入查询的正则表达式">
        <NInput v-model:value="regText" @update:value="selectedReg = null" />
        <NSelect
          placeholder="预制正则列表"
          :value="selectedReg"
          class="w-[200px]"
          :options="regList"
          @update:value="handleSelect"
        />
      </NFormItem>

      <NFormItem required label="保存目录">
        <NInput
          :value="dirPath"
          placeholder="请选择文件夹路径"
          :input-props="{ class: 'cursor-pointer' }"
          readonly
          @click="selectSavingDir"
        />
      </NFormItem>
      <NFormItem label="同时下载任务数">
        <NInputNumber v-model:value="maxDownloadCount" :min="1" :disabled="isDownloading" />
      </NFormItem>
      <NFormItem label="单个任务的下载线程数">
        <NInputNumber v-model:value="concurrentCount" :min="1" :disabled="isDownloading" />
        <span class="ml-[15px]">下载线程越多，理论下载速度越快，请根据电脑配置合理设置</span>
      </NFormItem>
    </NForm>

    <div class="flex justify-between items-center mb-[10px]">
      <div>
        <NButton
          class="mr-[10px]"
          type="primary"
          :disabled="!regText || !fileList.length"
          @click="analysisContent"
        >
          读取匹配内容
        </NButton>
        <NButton
          v-if="searched.length"
          class="mr-[10px]"
          :disabled="!dirPath"
          type="primary"
          @click="saveToFile"
        >
          导出到文件
        </NButton>
        <template v-if="isUrl">
          <NButton
            v-if="searched.length && !isDownloading"
            class="mr-[10px]"
            type="primary"
            @click="handleDownload"
          >
            开始下载
          </NButton>
          <NButton v-else-if="isDownloading" class="mr-[10px]" type="primary" @click="stopDownload">
            停止下载
          </NButton>
        </template>
      </div>

      <span v-if="searched">已下载：{{ downloadCount }}；总共：{{ searched.length }}</span>
    </div>

    <div
      ref="outputRef"
      class="relative flex-1 bg-[#fff] border-solid border-[1px] border-[#ddd] p-[10px] overflow-auto"
    >
      <NButton
        v-show="outputs.length"
        class="sticky float-right left-[calc(100%)] top-0"
        size="small"
        type="primary"
        @click="clearOutputs"
      >
        清空
      </NButton>
      <p v-for="(m, i) of outputs" :key="i" class="my-[2px] w-[calc(100%-55px)]">{{ m }}</p>
    </div>
  </div>
</template>

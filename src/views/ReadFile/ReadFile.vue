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

const { outputs, clearOutputs } = useBackendOutput()

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
  <div class="flex flex-col h-full gap-3 overflow-hidden">
    <!-- 文件上传区 -->
    <n-upload :file-list="fileList" @update:file-list="handleSelectFile">
      <n-upload-dragger>
        <div class="flex items-center gap-4 px-2 py-1">
          <n-icon size="36" :depth="3">
            <ArchiveOutline />
          </n-icon>
          <div class="text-left">
            <n-text class="block text-[14px] font-medium">点击或拖拽文件到此区域</n-text>
            <n-text class="block text-[12px] text-[--textColor3] mt-[4px]">
              支持 TXT、Word（.doc/.docx）、Excel（.xls/.xlsx）及其他文本格式
            </n-text>
          </div>
        </div>
      </n-upload-dragger>
    </n-upload>

    <!-- 查询配置 -->
    <div class="config-card">
      <p class="section-title">查询配置</p>
      <n-form label-placement="top" :show-feedback="false" :show-require-mark="false">
        <n-form-item label="正则表达式">
          <div class="flex gap-2 w-full">
            <n-input
              v-model:value="regText"
              placeholder="输入正则表达式，例如：(https|http)://.*\.(jpg|png)"
              @update:value="selectedReg = null" />
            <n-select
              placeholder="预制正则"
              :value="selectedReg"
              class="w-[130px] shrink-0"
              :options="regList"
              @update:value="handleSelect" />
          </div>
        </n-form-item>
        <n-form-item label="保存目录" class="mt-3">
          <n-input
            :value="dirPath"
            placeholder="点击选择保存目录"
            :input-props="{ class: 'cursor-pointer' }"
            readonly
            @click="selectSavingDir" />
        </n-form-item>
        <div class="grid grid-cols-2 gap-4 mt-3">
          <n-form-item label="并发下载任务数">
            <n-input-number
              v-model:value="maxDownloadCount"
              :min="1"
              class="w-full"
              :disabled="downloadStatus === DownloadStatus.Processing" />
          </n-form-item>
          <n-form-item label="单任务下载线程数">
            <n-input-number
              v-model:value="concurrentCount"
              :min="1"
              class="w-full"
              :disabled="downloadStatus === DownloadStatus.Processing" />
          </n-form-item>
        </div>
      </n-form>
    </div>

    <!-- 操作栏 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <n-button type="primary" :disabled="!regText || !fileList.length" @click="analysisContent">
          读取匹配内容
        </n-button>
        <n-button v-if="searched.length" :disabled="!dirPath" @click="saveToFile">
          导出到文件
        </n-button>
        <template v-if="isUrl && searched.length">
          <n-button
            v-if="![DownloadStatus.Processing, DownloadStatus.Shutdown].includes(downloadStatus)"
            type="success"
            @click="handleDownload">
            开始下载
          </n-button>
          <n-button
            v-else
            :loading="downloadStatus === DownloadStatus.Shutdown"
            type="warning"
            @click="stopDownload">
            停止下载
          </n-button>
        </template>
      </div>
      <div v-if="searched.length" class="flex items-center gap-2 text-[13px] text-[--textColor2]">
        <span>
          匹配
          <b class="text-[--textColorBase] font-semibold">{{ searched.length }}</b>
          条
        </span>
        <n-divider vertical />
        <span>
          已下载
          <b
            class="font-semibold"
            :class="downloadCount ? 'text-[--successColor]' : 'text-[--textColorBase]'">
            {{ downloadCount }}
          </b>
        </span>
      </div>
    </div>

    <!-- 输出日志 -->
    <div class="log-panel flex-1 min-h-0">
      <div class="log-header">
        <p class="section-title !mb-0">输出日志</p>
        <n-button v-show="outputs.length" size="tiny" quaternary @click="clearOutputs">
          清空
        </n-button>
      </div>
      <div ref="output" class="log-body">
        <p v-if="!outputs.length" class="log-empty">暂无输出，操作完成后将在此显示进度</p>
        <p v-for="(m, i) of outputs" :key="i" class="log-line">
          <span class="log-arrow">›</span>{{ m }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.config-card {
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  padding: 14px 16px;
  background-color: var(--cardColor);
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--textColor3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 10px;
}

.log-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  overflow: hidden;

  .log-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: var(--cardColor);
    border-bottom: 1px solid var(--borderColor);
    flex-shrink: 0;
  }

  .log-body {
    flex: 1;
    overflow-y: auto;
    padding: 10px 12px;
    background-color: var(--actionColor);
    font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.7;
  }

  .log-empty {
    color: var(--textColor3);
    font-size: 12px;
    margin: 0;
  }

  .log-line {
    margin: 0;
    color: var(--textColorBase);
    word-break: break-all;
  }

  .log-arrow {
    color: var(--primaryColor);
    font-weight: 700;
    margin-right: 6px;
  }
}
</style>

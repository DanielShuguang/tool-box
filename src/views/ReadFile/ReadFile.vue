<script lang="ts" setup>
import {
  ArchiveOutline,
  DocumentTextOutline,
  DownloadOutline,
  AnalyticsOutline
} from '@vicons/ionicons5'
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

// 统计数据
const matchedCount = computed(() => searched.value.length)
</script>

<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <!-- 页面标题 -->
    <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0">
      <h2 class="text-lg font-semibold">文件读取</h2>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 overflow-auto p-4">
      <!-- 统计卡片 -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-blue-500">
              <DocumentTextOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">文件数</div>
              <div class="text-xl font-bold">{{ fileList.length }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-green-500">
              <AnalyticsOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">匹配数</div>
              <div class="text-xl font-bold">{{ matchedCount }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-orange-500">
              <DownloadOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">已下载</div>
              <div class="text-xl font-bold">{{ downloadCount }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文件上传区 -->
      <n-card :bordered="false" class="mb-4">
        <n-upload :file-list="fileList" @update:file-list="handleSelectFile">
          <n-upload-dragger>
            <div class="flex items-center gap-4 px-2 py-3">
              <n-icon size="36" :depth="3">
                <ArchiveOutline />
              </n-icon>
              <div class="text-left">
                <n-text class="block text-[14px] font-medium">点击或拖拽文件到此区域</n-text>
                <n-text class="block text-[12px] text-gray-400 mt-[4px]">
                  支持 TXT、Word（.doc/.docx）、Excel（.xls/.xlsx）及其他文本格式
                </n-text>
              </div>
            </div>
          </n-upload-dragger>
        </n-upload>
      </n-card>

      <!-- 查询配置 -->
      <n-card :bordered="false" class="mb-4">
        <template #header>
          <span class="text-base font-medium">查询配置</span>
        </template>

        <div class="flex flex-col gap-4">
          <div>
            <label class="text-sm font-medium mb-2 block">正则表达式</label>
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
          </div>

          <div>
            <label class="text-sm font-medium mb-2 block">保存目录</label>
            <n-input
              :value="dirPath"
              placeholder="点击选择保存目录"
              :input-props="{ class: 'cursor-pointer' }"
              readonly
              @click="selectSavingDir" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-2 block">并发下载任务数</label>
              <n-input-number
                v-model:value="maxDownloadCount"
                :min="1"
                class="w-full"
                :disabled="downloadStatus === DownloadStatus.Processing" />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">单任务下载线程数</label>
              <n-input-number
                v-model:value="concurrentCount"
                :min="1"
                class="w-full"
                :disabled="downloadStatus === DownloadStatus.Processing" />
            </div>
          </div>
        </div>
      </n-card>

      <!-- 操作栏 -->
      <n-card :bordered="false" class="mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <n-button
              type="primary"
              :disabled="!regText || !fileList.length"
              @click="analysisContent">
              读取匹配内容
            </n-button>
            <n-button v-if="searched.length" :disabled="!dirPath" @click="saveToFile">
              导出到文件
            </n-button>
            <template v-if="isUrl && searched.length">
              <n-button
                v-if="
                  ![DownloadStatus.Processing, DownloadStatus.Shutdown].includes(downloadStatus)
                "
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
          <div v-if="searched.length" class="flex items-center gap-2 text-sm text-gray-500">
            <span>
              匹配
              <b class="text-gray-700 font-semibold">{{ searched.length }}</b>
              条
            </span>
            <n-divider vertical />
            <span>
              已下载
              <b class="font-semibold" :class="downloadCount ? 'text-green-500' : 'text-gray-700'">
                {{ downloadCount }}
              </b>
            </span>
          </div>
        </div>
      </n-card>

      <!-- 输出日志 -->
      <n-card :bordered="false">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-base font-medium">输出日志</span>
            <n-button v-show="outputs.length" size="tiny" quaternary @click="clearOutputs">
              清空
            </n-button>
          </div>
        </template>

        <div class="log-panel flex-1 min-h-0">
          <div ref="output" class="log-body">
            <p v-if="!outputs.length" class="log-empty">暂无输出，操作完成后将在此显示进度</p>
            <p v-for="(m, i) of outputs" :key="i" class="log-line">
              <span class="log-arrow">›</span>{{ m }}
            </p>
          </div>
        </div>
      </n-card>
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

.log-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  overflow: hidden;

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

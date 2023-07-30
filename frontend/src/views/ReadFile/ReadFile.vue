<script lang="ts" setup>
import { ArchiveOutline } from '@vicons/ionicons5'
import {
  useAnalysisFileContent,
  useManageDownloader,
  useManageRegexSelect,
  useUpdateSavingDir
} from './logic'

const { dirPath, selectSavingDir } = useUpdateSavingDir()

const { regList, regText, selectedReg, handleSelect } = useManageRegexSelect()

const { fileList, searched, analysisContent, handleSelectFile } = useAnalysisFileContent(regText)

const { isDownloading, downloadCount, handleDownload, stopDownload } = useManageDownloader(
  searched,
  dirPath
)
</script>

<template>
  <div>
    <NUpload :file-list="fileList" @update:file-list="handleSelectFile">
      <NUploadDragger>
        <div style="margin-bottom: 12px">
          <NIcon size="48" :depth="3">
            <ArchiveOutline />
          </NIcon>
        </div>
        <NText style="font-size: 16px">点击或者拖动文件到该区域</NText>
      </NUploadDragger>
    </NUpload>

    <NFormItem label-placement="left" required label="输入查询的正则表达式">
      <NInput v-model:value="regText" @update:value="selectedReg = ''" />
      <NSelect
        placeholder="预制匹配符"
        :value="selectedReg"
        style="width: 200px"
        :options="regList"
        @update:value="handleSelect"
      />
    </NFormItem>

    <NFormItem label-placement="left" required label="保存目录">
      <NInput
        :value="dirPath"
        class="dir-select"
        placeholder="请选择文件夹路径"
        readonly
        @click="selectSavingDir"
      />
      <NButton></NButton>
    </NFormItem>

    <div class="btn-group">
      <div>
        <NButton type="primary" :disabled="!regText || !fileList.length" @click="analysisContent">
          读取匹配内容
        </NButton>
        <NButton v-if="searched.length && !isDownloading" type="primary" @click="handleDownload">
          开始下载
        </NButton>
        <NButton v-else-if="isDownloading" type="primary" @click="stopDownload">停止下载</NButton>
      </div>

      <span v-if="downloadCount" class="download-count">
        已下载：{{ downloadCount }}；总共：{{ searched.length }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dir-select :deep(input) {
  cursor: pointer;
}

.btn-group {
  display: flex;
  justify-content: space-between;
  align-items: center;

  :deep(button) {
    margin-right: 10px;
  }
}
</style>

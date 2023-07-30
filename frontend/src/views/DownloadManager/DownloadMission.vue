<script lang="ts" setup>
import { DownloadItem } from './logic'
import { useDownload } from './useDownload'
import { DownloadOutline } from '@vicons/ionicons5'

const { initDetail } = toRefs(
  defineProps<{
    initDetail: DownloadItem
  }>()
)

const { fileTotalSize, percent, createDownload, changeStatus } = useDownload()

onMounted(() => {
  createDownload(initDetail.value.url, initDetail.value.dirPath)
})
</script>

<template>
  <div class="download-mission" :title="initDetail.url" @dblclick.stop="changeStatus()">
    <div class="download-schedule" :style="{ width: `${percent / 100}%` }"></div>
    <span class="filename">{{ initDetail.filename }}</span>
    <span class="file-size">{{ fileTotalSize }}</span>
    <NIcon size="14">
      <DownloadOutline class="down-btn" />
    </NIcon>
  </div>
</template>

<style scoped lang="scss">
.download-mission {
  position: relative;
  width: 100%;
  height: 100px;
}

.download-schedule {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(135deg, rgb(222, 231, 249), rgb(172, 200, 251));
}
</style>

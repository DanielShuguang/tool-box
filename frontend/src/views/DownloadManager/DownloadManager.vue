<script lang="ts" setup>
import DownloadMission from './DownloadMission.vue'
import { useDownloadList } from './logic'

const { downloadList } = useDownloadList()
</script>

<template>
  <div class="download-manager">
    <div class="download-list">
      <DownloadMission v-for="item in downloadList" :key="item.url" :init-detail="item" />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>

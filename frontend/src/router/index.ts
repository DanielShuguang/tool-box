import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/readFile'
  },
  {
    path: '/readFile',
    component: () => import('@/views/ReadFile/ReadFile.vue'),
    meta: { title: '文件读取' }
  },
  {
    path: '/downloadManager',
    component: () => import('@/views/DownloadManager/DownloadManager.vue'),
    meta: { title: '下载管理器' }
  }
]

export default createRouter({
  routes,
  history: createWebHashHistory()
})

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
    path: '/speechKits',
    component: () => import('@/views/SpeechKits/SpeechKits.vue'),
    meta: { title: '语音工具包' }
  }
]

export default createRouter({
  routes,
  history: createWebHashHistory()
})

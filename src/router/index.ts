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
    path: '/fileSearch',
    component: () => import('@/views/FileSearch/FileSearch.vue'),
    meta: { title: '文件搜索' }
  }
]

export default createRouter({
  routes,
  history: createWebHashHistory()
})

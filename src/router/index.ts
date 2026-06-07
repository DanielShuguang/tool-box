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
  },
  {
    path: '/windowsActivatiion',
    component: () => import('@/views/WindowsActivatiion/WindowsActivatiion.vue'),
    meta: { title: 'Windows激活' }
  },
  {
    path: '/eyeProtection',
    component: () => import('@/views/EyeProtection/EyeProtection.vue'),
    meta: { title: '护眼工具' }
  },
  {
    path: '/translator',
    component: () => import('@/views/Translator/Translator.vue'),
    meta: { title: '翻译工具' }
  },
  {
    path: '/todo',
    name: 'Todo',
    component: () => import('@/views/Todo/Todo.vue'),
    meta: { title: '待办事项' }
  },
  {
    path: '/randomPicker',
    component: () => import('@/views/RandomPicker/RandomPicker.vue'),
    meta: { title: '随机选择' }
  },
  {
    path: '/screenshot',
    component: () => import('@/views/Screenshot/index.vue'),
    meta: { title: '截图工具' }
  },
  {
    path: '/screenshot/capture',
    component: () => import('@/views/Screenshot/components/CaptureWindow.vue'),
    meta: { title: '截图选择' }
  },
  {
    path: '/screenshot/preview',
    component: () => import('@/views/Screenshot/components/PreviewWindow.vue'),
    meta: { title: '截图预览' }
  },
  {
    path: '/screenshot/editor',
    component: () => import('@/views/Screenshot/components/EditorWindow.vue'),
    meta: { title: '截图编辑' }
  }
]

export default createRouter({
  routes,
  history: createWebHashHistory()
})

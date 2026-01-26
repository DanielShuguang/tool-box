import 'normalize.css'
import '@/assets/styles/base.scss'
import 'virtual:uno.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from '@/router'
import { createPiniaStorage } from '@/plugins/pinia-storage-adapter'
import { TimeUnits } from '@/utils/time'

const app = createApp(App)
const pinia = createPinia()

// 注册持久化插件
pinia.use(createPiniaStorage({ debounce: TimeUnits.Second }))

app.use(pinia)
app.use(router)

app.mount('#app')

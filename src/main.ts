import 'normalize.css'
import '@/assets/styles/base.scss'
import 'virtual:uno.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from '@/router'
import { emitter } from './utils/event'
import { createPiniaStorage } from '@/plugins/pinia-storage-adapter'
import { TimeUnits } from '@/utils/time'

const app = createApp(App)
const pinia = createPinia()

pinia.use(createPiniaStorage({ debounce: TimeUnits.Second }))

app.use(pinia)
app.use(router)

app.config.globalProperties.$bus = emitter

app.mount('#app')

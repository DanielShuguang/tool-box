import 'normalize.css'
import '@/assets/styles/base.scss'
import 'virtual:uno.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import { emitter } from './utils/event'

const app = createApp(App)
app.use(router)
app.mount('#app')

app.config.globalProperties.$bus = emitter

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import './style.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import 'bootstrap-icons/font/bootstrap-icons.css'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import dayjs from 'dayjs'
import 'dayjs/locale/ru' // ✅ добавлено
dayjs.locale('ru')       // ✅ применяем глобально

function formatDate(date, format = 'DD.MM.YYYY') {
  return dayjs(date).format(format)
}

const app = createApp(App)
const pinia = createPinia()

app.provide('formatDate', formatDate)

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)

app.mount('#app')
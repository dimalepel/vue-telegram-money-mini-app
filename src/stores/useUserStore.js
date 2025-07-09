import { defineStore } from 'pinia'
import axios from 'axios'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: null,
    telegramId: null,
    firstName: '',
    username: '',
    status: '',
    email: '',
    isAuthenticated: false,
  }),

  actions: {
    async findOrCreateUser(tgUser) {
      const router = useRouter()

      try {
        // 1. Пытаемся найти пользователя
        const { data } = await axios.get(`https://fcd1d63245775e7f.mokky.dev/users?telegram_id=${tgUser.id}`)

        if (data && data.id) {
          // Пользователь найден
          this._setUser(data)
        } else {
          // 2. Не найден — создаём нового
          const createRes = await axios.post('https://fcd1d63245775e7f.mokky.dev/users', {
            telegram_id: tgUser.id,
            first_name: tgUser.first_name,
            username: tgUser.username || '',
          })

          this._setUser(createRes.data)
        }

        router.push('/add-record')
      } catch (err) {
        console.error('Ошибка при получении или создании пользователя:', err)
      }
    },

    _setUser(data) {
      this.id = data.id
      this.telegramId = data.telegram_id
      this.firstName = data.first_name
      this.username = data.username
      this.status = data.status || ''
      this.email = data.email || ''
      this.isAuthenticated = true
    },

    logout() {
      this.id = null
      this.telegramId = null
      this.firstName = ''
      this.username = ''
      this.status = ''
      this.email = ''
      this.isAuthenticated = false
    },
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'user',
        storage: localStorage,
      },
    ],
  },
})
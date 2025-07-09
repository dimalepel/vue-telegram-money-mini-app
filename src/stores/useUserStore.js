import { defineStore } from 'pinia'
import axios from 'axios'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: null,
    telegram_id: null,
    first_name: '',
    username: '',
    isAuthenticated: false,
  }),

  actions: {
    async findOrCreateUser(tgUser) {
      const router = useRouter()

      try {
        // 1. Пытаемся найти пользователя
        const { data } = await axios.get(`https://fcd1d63245775e7f.mokky.dev/users?telegram_id=${tgUser.telegram_id}`)

        if (data && data.id) {
          // Пользователь найден
          this._setUser(data)
        } else {
          // 2. Не найден — создаём нового
          const createRes = await axios.post('https://fcd1d63245775e7f.mokky.dev/users', {
            telegram_id: tgUser.telegram_id,
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
      this.telegram_id = data.telegram_id
      this.first_name = data.first_name
      this.username = data.username
      this.isAuthenticated = true
    },

    logout() {
      this.id = null
      this.telegram_id = null
      this.first_name = ''
      this.username = ''
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
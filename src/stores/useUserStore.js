import { defineStore } from 'pinia'
import axios from 'axios'

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
      // try {
      //   // 1. Пытаемся найти пользователя
      //   const { data } = await axios.get(`https://fcd1d63245775e7f.mokky.dev/users?telegram_id=${tgUser.id}`)
      //
      //   if (Array.isArray(data) && data.length > 0) {
      //     // Пользователь найден
      //     this._setUser(data[0])
      //   } else {
      //     // 2. Не найден — создаём нового
      //     const createRes = await axios.post('https://fcd1d63245775e7f.mokky.dev/users', {
      //       telegram_id: tgUser.id,
      //       first_name: tgUser.first_name,
      //       username: tgUser.username || '',
      //     })
      //
      //     this._setUser(createRes.data)
      //   }
      // } catch (err) {
      //   console.error('Ошибка при получении или создании пользователя:', err)
      // }

      try {
        const res = await axios.post("https://fcd1d63245775e7f.mokky.dev/auth", {
          email: `${tgUser.id}_mymoney@app.com`,
          password: `${tgUser.id}`
        }, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          }
        });

        console.log("Вход успешен:", res.data);

      } catch (error) {
        if (error.response) {
          if (error.response.status === 404) {
            console.error("Пользователь не найден. Пытаемся зарегистрировать...");

            try {
              const registerRes = await axios.post("https://fcd1d63245775e7f.mokky.dev/register", {
                fullName: tgUser.first_name,
                telegram_id: tgUser.id,
                email: `${tgUser.id}_mymoney@app.com`,
                password: `${tgUser.id}`
              }, {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json"
                }
              });

              console.log("Регистрация успешна:", registerRes.data);

            } catch (regError) {
              console.error("Ошибка при регистрации:", regError.response?.status, regError.response?.data);
            }

          } else {
            console.error("Ошибка входа:", error.response.status, error.response.data);
          }
        } else {
          console.error("Сетевая ошибка или сервер не отвечает:", error.message);
        }
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
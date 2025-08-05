import { defineStore } from 'pinia'
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

export const useUserStore = defineStore('user', {
  state: () => ({
    id: null,
    telegramId: null,
    firstName: '',
    username: '',
    status: '',
    email: '',
    isAuthenticated: false,
    token: ''
  }),

  actions: {
    async findOrCreateUser(tgUser) {
      /*
       * Логика: ищем пользователя по tg id.
       * Если такой есть, то вводим его логин и пароль и авторизуемся для получения токена.
       * Если такого нет, то мы делаем регистрацию и получаем токен.
       */
      console.log('Вызов findOrCreateUser с:', tgUser);

      if (!tgUser || !tgUser.id) {
        console.error('tgUser отсутствует или не содержит id');
        return;
      }

      try {
        const res = await axios.post(`${baseURL}/auth`, {
          email: `${tgUser.id}_mymoney@app.com`,
          password: `${tgUser.id}`
        }, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          }
        });

        //console.log(res.data.token)
        const storageData = {
          id: res.data.data.id,
          telegram_id: res.data.data.telegram_id,
          first_name: res.data.data.first_name,
          token: res.data.token
        }
        this._setUser(storageData)

      } catch (error) {
        try {
          const registerRes = await axios.post(`${baseURL}/register`, {
            fullName: tgUser.first_name,
            telegram_id: tgUser.id,
            email: `${tgUser.id}_mymoney@app.com`,
            password: `${tgUser.id}`,
            created_at: new Date().toISOString(),
          }, {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json"
            }
          });

          const storageData = {
            id: registerRes.data.data.id,
            token: registerRes.data.token
          }
          this._setUser(storageData)

          //console.log("Регистрация успешна:", registerRes.data);

        } catch (regError) {
          console.error("Ошибка при регистрации:", regError.response?.status, regError.response?.data);
        }

        //console.error("Сетевая ошибка или сервер не отвечает:", error.message);
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
      this.token = data.token
    },

    logout() {
      this.id = null
      this.telegramId = null
      this.firstName = ''
      this.username = ''
      this.status = ''
      this.email = ''
      this.isAuthenticated = false
      this.token = ''
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
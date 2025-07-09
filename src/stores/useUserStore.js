import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: null,
    telegramId: null,
    firstName: '',
    username: '',
    isAuthenticated: false,
  }),
  actions: {
    setUser(user) {
      this.id = user.id
      this.telegramId = user.telegramId
      this.firstName = user.first_name
      this.username = user.username
      this.isAuthenticated = true
    },
    logout() {
      this.id = null
      this.telegramId = null
      this.firstName = ''
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
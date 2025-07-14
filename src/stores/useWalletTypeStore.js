import { defineStore } from 'pinia'
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

export const useWalletTypeStore = defineStore('walletType', {
  state: () => ({
    walletTypes: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchWalletTypes() {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get(`${baseURL}/wallet-types`)
        this.walletTypes = res.data
      } catch (err) {
        this.error = 'Не удалось загрузить типы кошельков'
        console.error(err)
      } finally {
        this.loading = false
      }
    }
  },

  getters: {
    getByType: (state) => (type) => {
      return state.walletTypes.find(t => t.type === type)
    },
    getById: (state) => (id) => {
      return state.walletTypes.find(t => t.id === id)
    }
  }
})
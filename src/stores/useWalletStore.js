import { defineStore } from 'pinia'
import axios from 'axios'

import { useUserStore } from './useUserStore'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    loading: false,
    error: null,
    wallets: []
  }),
  actions: {
    async fetchWallets() {
      const userStore = useUserStore()

      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`https://fcd1d63245775e7f.mokky.dev/wallets?_relations=wallet-types&user_id=${userStore.id}`)
        this.wallets = response.data
      } catch (error) {
        this.error = 'Ошибка при получении кошельков'
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    async addWallet({ name, typeId, balance, userId }) {
      try {
        const res = await axios.post('https://fcd1d63245775e7f.mokky.dev/wallets', {
          name: name,
          'wallet-type_id': typeId,
          balance: balance,
          user_id: userId
        })
      } catch (err) {
        console.error('Ошибка при добавлении кошелька', err)
        throw err
      }
    },

    async updateWalletBalance(walletId, amountDelta) {
      const wallet = this.wallets.find(w => w.id === walletId)
      if (!wallet) {
        console.error(`Кошелёк с id ${walletId} не найден`)
        return
      }

      const newBalance = wallet.balance + amountDelta

      try {
        await axios.patch(`https://fcd1d63245775e7f.mokky.dev/wallets/${walletId}`, {
          balance: newBalance
        })
        // Обновляем локальное значение, чтобы UI не ждал следующего fetch
        wallet.balance = newBalance
      } catch (err) {
        console.error('Ошибка при обновлении баланса кошелька', err)
        throw err
      }
    }
  }
})
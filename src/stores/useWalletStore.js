import { defineStore } from 'pinia'
import axios from 'axios'

import { useUserStore } from './useUserStore'

const baseURL = import.meta.env.VITE_API_URL

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
        const response = await axios.get(`${baseURL}/wallets?_relations=wallet-types&user_id=${userStore.id}`, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        })
        this.wallets = response.data
      } catch (error) {
        this.error = 'Ошибка при получении кошельков'
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    async addWallet({ name, typeId, balance, userId }) {
      const userStore = useUserStore()

      try {
        const res = await axios.post(`${baseURL}/wallets`, {
          name: name,
          'wallet-type_id': typeId,
          balance: balance,
          user_id: userId
        }, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        })
      } catch (err) {
        console.error('Ошибка при добавлении кошелька', err)
        throw err
      }
    },

    async updateWalletBalance(walletId, amountDelta) {
      const wallet = this.wallets.find(w => w.id === walletId)
      const userStore = useUserStore()

      if (!wallet) {
        console.error(`Кошелёк с id ${walletId} не найден`)
        return
      }

      const newBalance = wallet.balance + amountDelta

      try {
        await axios.patch(`${baseURL}/wallets/${walletId}`, {
          balance: newBalance
        }, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        })
        // Обновляем локальное значение, чтобы UI не ждал следующего fetch
        wallet.balance = newBalance
      } catch (err) {
        console.error('Ошибка при обновлении баланса кошелька', err)
        throw err
      }
    },

    async deleteWallet(walletId, option = 'wallet') {
      const userStore = useUserStore()

      if (option === 'cancel') return

      try {
        if (option === 'walletAndTransactions') {
          // Получение и удаление всех транзакций кошелька
          const response = await axios.get(`${baseURL}/transactions?wallet_id=${walletId}`, {
            headers: {
              Authorization: `Bearer ${userStore.token}`
            }
          })

          const transactions = response.data
          for (const tx of transactions) {
            await axios.delete(`${baseURL}/transactions/${tx.id}`, {
              headers: {
                Authorization: `Bearer ${userStore.token}`
              }
            })
          }
        }

        // Удаление самого кошелька
        await axios.delete(`${baseURL}/wallets/${walletId}`, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        })

        // Обновляем локальный список кошельков
        this.wallets = this.wallets.filter(w => w.id !== walletId)
      } catch (err) {
        console.error('Ошибка при удалении кошелька или транзакций', err)
        throw err
      }
    },

    async editWallet(walletId, { name, typeId, balance }) {
      const userStore = useUserStore()

      try {
        await axios.patch(`${baseURL}/wallets/${walletId}`, {
          name,
          'wallet-type_id': typeId,
          balance
        }, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        })

        // Обновление локального хранилища
        const walletIndex = this.wallets.findIndex(w => w.id === walletId)
        if (walletIndex !== -1) {
          this.wallets[walletIndex] = {
            ...this.wallets[walletIndex],
            name,
            balance,
            'wallet-type_id': typeId
          }
        }
      } catch (err) {
        console.error('Ошибка при редактировании депозита', err)
        throw err
      }
    }
  }
})
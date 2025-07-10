import { defineStore } from 'pinia'
import axios from 'axios'
import dayjs from 'dayjs' // ✅ Правильный импорт
import { useUserStore } from './useUserStore'
import {useWalletStore} from "@/stores/useWalletStore.js";

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    transactions: [],
    loading: false,
    error: null
  }),

  getters: {
    groupedDaysByMonth: (state) => {
      return (monthStr) => {
        const daysInMonth = dayjs(monthStr).daysInMonth()
        const result = []

        for (let day = 1; day <= daysInMonth; day++) {
          const dateKey = `${monthStr}-${String(day).padStart(2, '0')}`
          const transactions = state.transactions.filter(tx =>
            tx.date && tx.date.startsWith(dateKey)
          )

          const income = transactions
            .filter(tx => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0)

          const expense = transactions
            .filter(tx => tx.amount < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

          result.push({
            day: String(day).padStart(2, '0'),
            date: dateKey,
            income,
            expense
          })
        }

        return result
      }
    }
  },

  actions: {
    async fetchTransactions() {
      const userStore = useUserStore()

      this.loading = true
      this.error = null
      try {
        const response = await axios.get(
          `https://fcd1d63245775e7f.mokky.dev/transactions?user_id=${userStore.id}`, {
            headers: {
              Authorization: `Bearer ${userStore.token}`
            }
          }
        )
        this.transactions = response.data
      } catch (err) {
        this.error = 'Ошибка при загрузке транзакций'
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    async addTransaction(payload) {
      const userStore = useUserStore()

      try {
        const response = await axios.post(
          'https://fcd1d63245775e7f.mokky.dev/transactions',
          payload,{
            headers: {
              Authorization: `Bearer ${userStore.token}`
            }
          }
        )
      } catch (err) {
        this.error = 'Ошибка при добавлении транзакции'
        console.error(err)
        throw err
      }
    },

    async deleteTransaction(id) {
      const userStore = useUserStore()

      this.loading = true
      this.error = null

      try {
        // Находим удаляемую транзакцию
        const transaction = this.transactions.find(t => t.id === id)
        if (!transaction) {
          throw new Error('Транзакция не найдена')
        }

        // Удаляем транзакцию на сервере
        await axios.delete(`https://fcd1d63245775e7f.mokky.dev/transactions/${id}`, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        })

        // Пересчитываем баланс кошелька
        const walletStore = useWalletStore()

        const delta = -transaction.amount
        await walletStore.updateWalletBalance(transaction.wallet_id, delta)

        // Обновляем локальное состояние транзакций
        this.transactions = this.transactions.filter(t => t.id !== id)
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка при удалении транзакции'
        console.error('Ошибка удаления транзакции:', error)
      } finally {
        this.loading = false
      }
    }
  }
})
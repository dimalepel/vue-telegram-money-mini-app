import { defineStore } from 'pinia'
import axios from 'axios'
import dayjs from 'dayjs' // ✅ Правильный импорт
import { useUserStore } from './useUserStore'
import { useWalletStore } from "@/stores/useWalletStore";

const baseURL = import.meta.env.VITE_API_URL

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
            tx.date && dayjs(tx.date).format('YYYY-MM-DD') === dateKey
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
          `${baseURL}/transactions?user_id=${userStore.id}`, {
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

    // async addTransaction(payload) {
    //   const userStore = useUserStore()
    //
    //   try {
    //     const response = await axios.post(
    //       `${baseURL}/transactions`,
    //       payload,{
    //         headers: {
    //           Authorization: `Bearer ${userStore.token}`
    //         }
    //       }
    //     )
    //   } catch (err) {
    //     this.error = 'Ошибка при добавлении транзакции'
    //     console.error(err)
    //     throw err
    //   }
    // },

    async addTransaction(payload) {
      const userStore = useUserStore()

      try {
        // Если payload содержит дочерние транзакции
        if (payload.children && payload.children.length > 0) {
          // Сохраняем родительскую транзакцию
          const parentPayload = {
            ...payload,
            children: undefined, // убираем детей из основного запроса
          }
          const parentResponse = await axios.post(
            `${baseURL}/transactions`,
            parentPayload,
            { headers: { Authorization: `Bearer ${userStore.token}` } }
          )

          const parentId = parentResponse.data.id

          // Сохраняем дочерние транзакции, присваивая parent_id
          for (const child of payload.children) {
            const childPayload = {
              ...child,
              parent_id: parentId,
              user_id: userStore.id,
              created_at: new Date().toISOString(),
            }
            await axios.post(
              `${baseURL}/transactions`,
              childPayload,
              { headers: { Authorization: `Bearer ${userStore.token}` } }
            )
          }

          // Можно обновить локальное состояние, вызвав fetchTransactions() или добавить вручную
          await this.fetchTransactions()

        } else {
          // Обычное добавление без детей
          const response = await axios.post(
            `${baseURL}/transactions`,
            payload,{
              headers: {
                Authorization: `Bearer ${userStore.token}`
              }
            }
          )
          // Добавить в локальное состояние, если нужно
          this.transactions.push(response.data)
        }
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
        // Ищем родителя и дочерние
        const transaction = this.transactions.find(t => t.id === id)
        if (!transaction) {
          throw new Error('Транзакция не найдена')
        }

        // Удаляем дочерние, если есть
        const children = this.transactions.filter(t => t.parent_id === id)
        for (const child of children) {
          await axios.delete(`${baseURL}/transactions/${child.id}`, {
            headers: { Authorization: `Bearer ${userStore.token}` }
          })
          const walletStore = useWalletStore()
          await walletStore.updateWalletBalance(child.wallet_id, -child.amount)
        }

        // Удаляем родителя
        await axios.delete(`${baseURL}/transactions/${id}`, {
          headers: { Authorization: `Bearer ${userStore.token}` }
        })
        const walletStore = useWalletStore()
        await walletStore.updateWalletBalance(transaction.wallet_id, -transaction.amount)

        // Обновляем локальное состояние
        this.transactions = this.transactions.filter(t => t.id !== id && !children.some(c => c.id === t.id))
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка при удалении транзакции'
        console.error('Ошибка удаления транзакции:', error)
      } finally {
        this.loading = false
      }
    },

    // async deleteTransaction(id) {
    //   const userStore = useUserStore()
    //
    //   this.loading = true
    //   this.error = null
    //
    //   try {
    //     // Находим удаляемую транзакцию
    //     const transaction = this.transactions.find(t => t.id === id)
    //     if (!transaction) {
    //       throw new Error('Транзакция не найдена')
    //     }
    //
    //     // Удаляем транзакцию на сервере
    //     await axios.delete(`${baseURL}/transactions/${id}`, {
    //       headers: {
    //         Authorization: `Bearer ${userStore.token}`
    //       }
    //     })
    //
    //     // Пересчитываем баланс кошелька
    //     const walletStore = useWalletStore()
    //
    //     const delta = -transaction.amount
    //     await walletStore.updateWalletBalance(transaction.wallet_id, delta)
    //
    //     // Обновляем локальное состояние транзакций
    //     this.transactions = this.transactions.filter(t => t.id !== id)
    //   } catch (error) {
    //     this.error = error.response?.data?.message || 'Ошибка при удалении транзакции'
    //     console.error('Ошибка удаления транзакции:', error)
    //   } finally {
    //     this.loading = false
    //   }
    // }
  }
})
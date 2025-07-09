import { defineStore } from 'pinia'
import axios from 'axios'

import { useUserStore } from './useUserStore'

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    loading: false,
    error: null,
  }),

  getters: {
    allCategories: (state) => state.categories,
    incomeCategories: (state) => state.categories.filter(cat => cat.type === 'income'),
    expenditureCategories: (state) => state.categories.filter(cat => cat.type === 'expenditure'),
    getById: (state) => (id) => state.categories.find(cat => cat.id === id),
  },

  actions: {
    setCategories(categories) {
      this.categories = categories
    },

    async fetchCategories() {
      const userStore = useUserStore()

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`https://fcd1d63245775e7f.mokky.dev/categories?user_id=${userStore.id}`)

        this.setCategories(response.data)
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки категорий'
        console.error('Ошибка получения категорий:', error)
      } finally {
        this.loading = false
      }
    },

    async deleteCategory(id) {
      this.loading = true
      this.error = null

      try {
        await axios.delete(`https://fcd1d63245775e7f.mokky.dev/categories/${id}`)

        // Удаляем из локального состояния
        this.categories = this.categories.filter(cat => cat.id !== id)
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка при удалении категории'
        console.error('Ошибка удаления категории:', error)
      } finally {
        this.loading = false
      }
    },

    async createCategory(name, type) {
      const userStore = useUserStore()
      this.loading = true
      this.error = null

      try {
        const response = await axios.post('https://fcd1d63245775e7f.mokky.dev/categories', {
          name,
          type,              // "income" или "expenditure"
          user_id: userStore.id,
        })

        // Добавляем в локальный список
        this.categories.push(response.data)
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка при создании категории'
        console.error('Ошибка создания категории:', error)
      } finally {
        this.loading = false
      }
    }
  },
})
import { defineStore } from 'pinia'
import axios from 'axios'

import { useUserStore } from './useUserStore'

const baseURL = import.meta.env.VITE_API_URL

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
        const response = await axios.get(`${baseURL}/categories?user_id=${userStore.id}`)

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
        await axios.delete(`${baseURL}/categories/${id}`)

        // Удаляем из локального состояния
        this.categories = this.categories.filter(cat => cat.id !== id)
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка при удалении категории'
        console.error('Ошибка удаления категории:', error)
      } finally {
        this.loading = false
      }
    },

    async createCategory(name, type, color) {
      const userStore = useUserStore()
      this.loading = true
      this.error = null

      try {
        const response = await axios.post(`${baseURL}/categories`, {
          name,
          type,              // "income" или "expenditure"
          color,
          user_id: userStore.id,
        })

        // Добавляем в локальный список
        console.log(response.data)
        const newCategory = response.data
        this.categories.push(newCategory)
        return newCategory
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка при создании категории'
        console.error('Ошибка создания категории:', error)
      } finally {
        this.loading = false
      }
    },

    async updateCategory(id, name, color) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.patch(`${baseURL}/categories/${id}`, { name, color })

        const index = this.categories.findIndex(cat => cat.id === id)
        if (index !== -1) {
          this.categories[index] = response.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка при обновлении категории'
        console.error('Ошибка обновления категории:', error)
      } finally {
        this.loading = false
      }
    }
  },
})
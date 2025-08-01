import { defineStore } from 'pinia'
import axios from 'axios'
import {useUserStore} from "@/stores/useUserStore";

const settingsURL = import.meta.env.VITE_SETTINGS_API_URL
const settingsToken = import.meta.env.VITE_SETTINGS_API_TOKEN

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    reminders_enabled: false,
    reminder_time: '17:30',
    show_archived_data: false,
  }),

  actions: {
    async loadSettings() {
      const userStore = useUserStore()
      const userId = userStore.id
      const token = userStore.token
      const telegramId = userStore.telegramId

      if (!userId || !token) {
        console.warn('Невозможно загрузить настройки — отсутствует пользователь или токен')
        return
      }

      try {
        const { data } = await axios.get(`${settingsURL}/settings/${userId}`, {
          headers: {
            'x-api-token': settingsToken
          }
        })

        this.reminders_enabled = data.reminders_enabled ?? false
        this.reminder_time = data.reminder_time ?? '17:30'
        this.show_archived_data = data.show_archived_data ?? false

      } catch (err) {
        const status = err.response?.status

        if (status === 404) {
          console.warn(`Настройки для пользователя ${userId} не найдены. Пытаемся создать...`)

          // Пытаемся создать настройки по умолчанию
          try {
            const res = await axios.post(`${settingsURL}/settings`, {
              user_id: userId,
              user_name: telegramId,
              reminders_enabled: false,
              reminder_time: '17:30',
              show_archived_data: false
            }, {
              headers: {
                'x-api-token': settingsToken
              }
            })

            // Устанавливаем локальные значения
            this.reminders_enabled = false
            this.reminder_time = '17:30'
            this.show_archived_data = false

            console.log(`Настройки созданы для пользователя ${userId}`)
          } catch (createErr) {
            console.error('Ошибка при создании настроек:', createErr.response?.status, createErr.response?.data)
          }
        } else {
          console.error('Ошибка при загрузке настроек:', status, err.response?.data)
        }
      }
    },

    async updateSettings(newSettings) {
      const userStore = useUserStore()
      const userId = userStore.id
      const token = userStore.token

      if (!userId || !token) {
        console.warn('Нельзя обновить настройки — пользователь не авторизован')
        return
      }

      try {
        const response = await axios.patch(`${settingsURL}/settings/${userId}`, {
          settings: newSettings
        }, {
          headers: {
            'x-api-token': settingsToken,
            "Content-Type": "application/json"
          }
        })

        this.show_archived_data = response.data.settings?.show_archived_data ?? false

        this.reminders_enabled = response.data?.reminders_enabled ?? false
        this.reminder_time = response.data?.reminder_time ?? '17:30'
        this.show_archived_data = response.data?.show_archived_data ?? false
      } catch (err) {
        console.error('Ошибка при обновлении настроек:', err.response?.status, err.response?.data)
      }
    },

    resetSettings() {
      this.show_archived_data = false
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'settings',
        storage: localStorage,
      },
    ],
  }
})
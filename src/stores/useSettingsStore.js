import { defineStore } from 'pinia'
import axios from 'axios'
import {useUserStore} from "@/stores/useUserStore";

const settingsURL = import.meta.env.VITE_SETTINGS_API_URL
const settingsToken = import.meta.env.VITE_SETTINGS_API_TOKEN

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {
      reminders_enabled: false,
      reminder_time: '',
      show_archived_data: false,
      timezone: 'UTC',
      currency: 'BYN'
    },
    currencies: [
      { code: 'USD', name: 'Доллар США', symbol: '$' },
      { code: 'EUR', name: 'Евро', symbol: '€' },
      { code: 'RUB', name: 'Российский рубль', symbol: '₽' },
      { code: 'BYN', name: 'Белорусский рубль', symbol: 'Br' },
      { code: 'GBP', name: 'Британский фунт стерлингов', symbol: '£' },
      { code: 'JPY', name: 'Японская йена', symbol: '¥' }
    ],
    loading: false,
    error: null,
  }),

  getters: {
    currentCurrency(state) {
      return state.currencies.find(c => c.code === state.settings.currency) || null
    }
  },

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

        this.settings.reminders_enabled = data.reminders_enabled ?? false
        this.settings.reminder_time = data.reminder_time ?? ''
        this.settings.show_archived_data = data.show_archived_data ?? false
        this.settings.timezone = data.timezone ?? 'UTC'
        this.settings.currency = data.currency ?? 'BYN'

        this.error = null;

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
              reminder_time: '',
              show_archived_data: false,
              timezone,
              currency: 'BYN'
            }, {
              headers: {
                'x-api-token': settingsToken
              }
            })

            // Устанавливаем локальные значения
            this.settings.reminders_enabled = false
            this.settings.reminder_time = ''
            this.settings.show_archived_data = false
            this.settings.timezone = 'UTC'
            this.settings.currency = 'BYN'

            console.log(`Настройки созданы для пользователя ${userId}`)
          } catch (createErr) {
            console.error('Ошибка при создании настроек:', createErr.response?.status, createErr.response?.data);
          }
        } else {
          console.error('Ошибка при загрузке настроек:', status, err.response?.data);
          this.error = 'Ошибка при загрузке настроек.';
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
          ...newSettings,
          timezone
        }, {
          headers: {
            'x-api-token': settingsToken,
            "Content-Type": "application/json"
          }
        })

        this.settings.reminders_enabled = response.data?.reminders_enabled ?? false
        this.settings.reminder_time = response.data?.reminder_time ?? ''
        this.settings.show_archived_data = response.data?.show_archived_data ?? false
        this.settings.timezone = response.data?.timezone ?? 'UTC'
        this.settings.currency = response.data?.currency ?? 'BYN'

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
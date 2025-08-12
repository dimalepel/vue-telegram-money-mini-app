import { defineStore } from 'pinia'
import axios from 'axios'

const settingsURL = import.meta.env.VITE_SETTINGS_API_URL
const settingsToken = import.meta.env.VITE_SETTINGS_API_TOKEN

export const useExchangeRatesStore = defineStore('exchangeRates', {
  state: () => ({
    exchange_rate: [],  // массив с курсами валют
    loading: false,
    error: null,
  }),

  getters: {
    // Получить курсы по базовой валюте (например, USD)
    getRatesByBase: (state) => (base) => {
      return state.exchange_rate.find(rate => rate.base === base) || null
    }
  },

  actions: {
    async loadExchangeRates() {
      this.loading = true
      this.error = null

      try {
        const { data } = await axios.get(`${settingsURL}/exchange-rates/`)

        if (Array.isArray(data) && data.length > 0) {
          this.exchange_rate = data
        } else {
          this.exchange_rate = []
          console.warn('Получены некорректные данные курсов валют:', data)
        }

      } catch (error) {
        this.error = 'Ошибка при загрузке курсов валют'
        console.error(this.error, error)
      } finally {
        this.loading = false
      }
    },

    convertToDefaultCurrency(amount, fromCurrency, toCurrency = 'BYN') {
      if (fromCurrency === toCurrency) return amount;

      // Попытка найти курс из fromCurrency к toCurrency напрямую
      const fromRates = this.exchange_rate.find(rate => rate.base === fromCurrency);
      if (fromRates && fromRates.rates[toCurrency] !== undefined) {
        return Number((amount * fromRates.rates[toCurrency]).toFixed(2));
      }

      // Если прямого курса нет, пытаемся конвертировать через BYN
      const baseIntermediate = 'BYN';

      // Конвертируем из fromCurrency в BYN
      let amountInBYN;
      if (fromCurrency === baseIntermediate) {
        amountInBYN = amount;
      } else if (fromRates && fromRates.rates[baseIntermediate] !== undefined) {
        amountInBYN = amount * fromRates.rates[baseIntermediate];
      } else {
        console.warn(`Нет курса для конвертации из ${fromCurrency} в ${baseIntermediate}`);
        return amount;
      }

      // Конвертируем из BYN в toCurrency
      if (toCurrency === baseIntermediate) {
        return Number(amountInBYN.toFixed(2));
      }

      const toRates = this.exchange_rate.find(rate => rate.base === toCurrency);
      if (toRates && toRates.rates[baseIntermediate] !== undefined) {
        // Чтобы получить курс BYN → toCurrency, делим 1 на курс toCurrency → BYN
        const bynToTarget = 1 / toRates.rates[baseIntermediate];
        return Number((amountInBYN * bynToTarget).toFixed(2));
      }

      console.warn(`Нет курса для конвертации из ${baseIntermediate} в ${toCurrency}`);
      return amount;
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'exchange_rates',
        storage: localStorage,
      },
    ],
  }
})
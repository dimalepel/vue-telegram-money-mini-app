<template>
  <Doughnut :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { computed } from 'vue'
import {TransactionTypes} from "@/constants/transactionTypes.js";
import { useCategoryStore } from '@/stores/useCategoryStore'
import {useSettingsStore} from "@/stores/useSettingsStore.js";
import {CurrenciesList} from "@/constants/currenciesList.js"


ChartJS.register(Title, Tooltip, Legend, ArcElement)

const props = defineProps({
  transactions: {
    type: Array,
    required: true
  },
  selectedDataset: {
    type: String,
    required: true
  },
  categories: {
    type: Array,
    required: true
  }
})

const categoryStore = useCategoryStore()
const settingsStore = useSettingsStore()

const getCurrencyDisplay = (code) => {
  const currency = CurrenciesList.find(c => c.code === code)
  return currency ? `${currency.symbol}` : code
}

function getCategoryNameById(id) {
  const category = props.categories.find(cat => cat.id === id)
  return category?.name || 'Без категории'
}

function getCategoryById(id) {
  return categoryStore.categories.find(cat => cat.id === id)
}

const datasetTypeMap = {
  income: TransactionTypes.INCOME,
  expense: TransactionTypes.EXPENDITURE
}

const chartData = computed(() => {
  const categorySums = {}
  const categoryColors = {}

  for (const tx of props.transactions) {
    const category = getCategoryById(tx.category_id)
    if (!category) continue

    const categoryName = category.name
    const amount = Math.abs(tx.amount)

    categorySums[categoryName] = (categorySums[categoryName] || 0) + amount
    categoryColors[categoryName] = category.color || '#cccccc' // fallback
  }

  const labels = Object.keys(categorySums)
  const data = Object.values(categorySums)
  const backgroundColor = labels.map(name => categoryColors[name])

  return {
    labels,
    datasets: [
      {
        label: 'Категории',
        data,
        backgroundColor
      }
    ]
  }
})

const transactionCurrency = props.transactions.length ? props.transactions[0].currency : 'BYN'

const chartOptions = {
  responsive: true,
  plugins: {
    tooltip: {
      displayColors: false,
      callbacks: {
        title: () => '',
        label: function (context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const value = context.raw
          const percentage = ((value / total) * 100).toFixed(1)
          return `${context.label}: ${value.toFixed(2)} ${getCurrencyDisplay(transactionCurrency)} (${percentage}%)`
        }
      }
    },
    title: {
      display: true,
      text: 'Распределение по категориям',
      color: '#333',
      font: { size: 18, family: 'Arial', weight: 'bold' },
      padding: { top: 10, bottom: 30 }
    },
    legend: { display: false }
  }
}
</script>

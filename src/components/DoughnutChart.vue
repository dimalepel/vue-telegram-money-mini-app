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

function getCategoryNameById(id) {
  const category = props.categories.find(cat => cat.id === id)
  return category?.name || 'Без категории'
}

const datasetTypeMap = {
  income: TransactionTypes.INCOME,
  expense: TransactionTypes.EXPENDITURE
}

const chartData = computed(() => {
  const categorySums = {}
  const selectedType = datasetTypeMap[props.selectedDataset]

  for (const tx of props.transactions) {
    if (tx.type !== selectedType) continue

    const categoryName = getCategoryNameById(tx.category_id)
    const amount = Math.abs(tx.amount)

    categorySums[categoryName] = (categorySums[categoryName] || 0) + amount
  }

  const labels = Object.keys(categorySums)
  const data = Object.values(categorySums)

  return {
    labels,
    datasets: [
      {
        label: 'Категории',
        data,
        backgroundColor: [
          '#f44336', '#4caf50', '#2196f3', '#ff9800',
          '#9c27b0', '#3f51b5', '#009688', '#e91e63',
          '#00bcd4', '#cddc39'
        ]
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const value = context.raw
          const percentage = ((value / total) * 100).toFixed(1)
          return `${context.label}: ${value.toFixed(2)} (${percentage}%)`
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

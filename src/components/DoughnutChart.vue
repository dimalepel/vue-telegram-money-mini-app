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

ChartJS.register(Title, Tooltip, Legend, ArcElement)

const props = defineProps({
  transactions: {
    type: Array,
    required: true
  },
  selectedDataset: {
    type: String,
    required: true
  }
})

const chartData = computed(() => {
  const categorySums = {}

  for (const tx of props.transactions) {
    if (tx.type !== props.selectedDataset) continue
    const category = tx.category || 'Без категории'
    categorySums[category] = (categorySums[category] || 0) + tx.amount
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
    legend: {
      position: 'bottom'
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const value = context.raw
          const percentage = ((value / total) * 100).toFixed(1)
          return `${context.label}: ${value} (${percentage}%)`
        }
      }
    },
    title: {
      display: true,
      text: 'Распределение по категориям'
    }
  }
}
</script>

<template>
  <div>
    <label class="mb-2 d-block">Выберите месяц:</label>
    <select v-model="selectedMonth" class="form-select mb-3 w-100">
      <option v-for="month in availableMonths" :key="month" :value="month">
        {{ month }}
      </option>
    </select>

    <Bar :data="chartData" :options="chartOptions" v-if="selectedMonth" />
  </div>
</template>

<script setup>
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const transactionStore = useTransactionStore()
const { transactions } = storeToRefs(transactionStore)

const selectedMonth = ref('')

onMounted(async () => {
  await transactionStore.fetchTransactions()

  const allMonths = Array.from(new Set(transactions.value.map(tx => tx.date?.slice(0, 7))))
  selectedMonth.value = allMonths.sort().at(-1) || ''
})

const availableMonths = computed(() => {
  const months = transactions.value.map(tx => tx.date?.slice(0, 7)).filter(Boolean)
  return [...new Set(months)].sort()
})

const chartData = computed(() => {
  const daily = transactionStore.groupedDaysByMonth(selectedMonth.value)

  return {
    labels: daily.map(d => d.day),
    datasets: [
      {
        label: 'Доходы',
        backgroundColor: '#4caf50',
        data: daily.map(d => d.income)
      },
      {
        label: 'Расходы',
        backgroundColor: '#f44336',
        data: daily.map(d => d.expense)
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Доходы и расходы по дням'
    },
    legend: {
      position: 'top'
    }
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 0,  // 👈 убирает наклон
        minRotation: 0   // 👈 оставляет горизонтально
      }
    },
    y: {
      beginAtZero: true
    }
  }
}
</script>

<style scoped>
:deep(canvas) {
  height: 350px !important;
}
</style>
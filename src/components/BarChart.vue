<template>
  <div>
    <p v-if="loading">Загрузка...</p>
    <p v-if="error">{{ error }}</p>
    <div v-if="!loading && !error">
      <div v-if="availableMonths.length > 0" class="d-flex align-items-center mb-3">
        <button class="btn btn-outline-primary me-2" @click="prevMonth" :disabled="currentIndex === 0">←</button>

        <span class="flex-grow-1 text-center fw-bold">{{ currentMonthLabel }}</span>

        <button class="btn btn-outline-primary ms-2" @click="nextMonth" :disabled="currentIndex === availableMonths.length - 1">→</button>
      </div>

      <div class="mb-3 w-100">
        <label for="datasetSelect" class="form-label">Выберите тип данных:</label>
        <select id="datasetSelect" v-model="selectedDataset" class="form-select w-100">
          <option value="income">Доходы</option>
          <option value="expense">Расходы</option>
        </select>
      </div>

      <Bar :data="chartData" :options="chartOptions" v-if="selectedMonth" />

      <AlertMessage v-else message="У Вас нет данных для аналитики" />
    </div>
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
import 'dayjs/locale/ru'
import AlertMessage from "@/components/AlertMessage.vue";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const transactionStore = useTransactionStore()
const { transactions, loading, error } = storeToRefs(transactionStore)

const selectedMonth = ref('')
const currentIndex = ref(0)
const selectedDataset = ref('income')  // 'income' или 'expense'

onMounted(async () => {
  await transactionStore.fetchTransactions()

  if (availableMonths.value.length > 0) {
    currentIndex.value = availableMonths.value.length - 1
    selectedMonth.value = availableMonths.value[currentIndex.value].value
  }
})

const availableMonths = computed(() => {
  const months = transactions.value
      .map(tx => tx.date?.slice(0, 7))
      .filter(Boolean)

  const uniqueMonths = [...new Set(months)].sort()

  return uniqueMonths.map(m => ({
    value: m,
    label: dayjs(m).locale('ru').format('MMMM YYYY').replace(/^./, c => c.toUpperCase())
  }))
})

const currentMonthLabel = computed(() => {
  return availableMonths.value[currentIndex.value]?.label || ''
})

function prevMonth() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    selectedMonth.value = availableMonths.value[currentIndex.value].value
  }
}

function nextMonth() {
  if (currentIndex.value < availableMonths.value.length - 1) {
    currentIndex.value++
    selectedMonth.value = availableMonths.value[currentIndex.value].value
  }
}

const chartData = computed(() => {
  const daily = transactionStore.groupedDaysByMonth(selectedMonth.value)

  return {
    labels: daily.map(d => d.day),
    datasets: [
      {
        label: selectedDataset.value === 'income' ? 'Доходы' : 'Расходы',
        backgroundColor: selectedDataset.value === 'income' ? '#4caf50' : '#f44336',
        data: selectedDataset.value === 'income'
            ? daily.map(d => d.income)
            : daily.map(d => d.expense)
      }
    ]
  }
})

const isMobile = window.innerWidth <= 768

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Доходы и расходы по дням',
      color: '#333',
      font: {
        size: 18,
        family: 'Arial',
        weight: 'bold'
      },
      padding: {
        top: 10,
        bottom: 30
      }
    },
    legend: {
      display: false // отключаем легенду, так как одна линия
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        maxRotation: 0,
        minRotation: 0
      },
      barPercentage: isMobile ? 0.9 : 0.8,
      categoryPercentage: isMobile ? 1 : 0.9,
      maxBarThickness: isMobile ? 50 : 40
    },
    y: {
      beginAtZero: true,
      grace: '10%'
    }
  }
}
</script>

<style scoped>
:deep(canvas) {
  height: 350px !important;
}
</style>

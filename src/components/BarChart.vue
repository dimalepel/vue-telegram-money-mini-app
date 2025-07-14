<template>
  <div>
    <p v-if="loading">Загрузка...</p>
    <p v-if="error">{{ error }}</p>
    <div v-if="!loading && !error">
      <div  v-if="availableMonths.length > 0" class="d-flex align-items-center mb-3">
        <button class="btn btn-outline-primary me-2" @click="prevMonth" :disabled="currentIndex === 0">←</button>

        <span class="flex-grow-1 text-center fw-bold">
        {{ currentMonthLabel }}
      </span>

        <button class="btn btn-outline-primary ms-2" @click="nextMonth" :disabled="currentIndex === availableMonths.length - 1">→</button>
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
      text: 'Доходы и расходы по дням',
      color: '#333',            // цвет текста заголовка
      font: {
        size: 18,               // размер шрифта заголовка
        family: 'Arial',        // шрифт
        weight: 'bold'          // жирность
      },
      padding: {
        top: 10,
        bottom: 30
      }
    },
    legend: {
      position: 'top'
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
      }
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

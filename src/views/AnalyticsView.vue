<template>
  <div>
    <p v-if="loading || walletsLoading">Загрузка...</p>
    <p v-if="error">{{ error }}</p>
    <p v-if="walletsError">{{ walletsError }}</p>

    <div v-if="!loading && !walletsLoading && !error && !walletsError">
      <div v-if="availableMonths.length > 0" class="d-flex align-items-center mb-3">
        <button class="btn btn-outline-primary me-2" @click="prevMonth" :disabled="currentIndex === 0">←</button>
        <span class="flex-grow-1 text-center fw-bold">{{ currentMonthLabel }}</span>
        <button class="btn btn-outline-primary ms-2" @click="nextMonth" :disabled="currentIndex === availableMonths.length - 1">→</button>
      </div>

      <!-- Фильтры -->
      <div class="row">
        <div class="mb-3 col-12">
          <label for="walletSelect" class="form-label">Депозит:</label>
          <select id="walletSelect" v-model="selectedWalletId" class="form-select">
            <option :value="null">Все депозиты</option>
            <option v-for="wallet in wallets" :key="wallet.id" :value="wallet.id">
              {{ wallet.name }}
            </option>
          </select>
        </div>

        <div class="mb-3 col-12">
          <label for="datasetSelect" class="form-label">Тип операций:</label>
          <select id="datasetSelect" v-model="selectedDataset" class="form-select">
            <option value="income">Доходы</option>
            <option value="expense">Расходы</option>
          </select>
        </div>

        <div class="mb-3 col-12">
          <label class="form-label d-block">Тип диаграммы:</label>
          <div class="btn-group w-100" role="group">
            <button
                class="btn"
                :class="selectedChartType === 'bar' ? 'btn-primary' : 'btn-outline-primary'"
                @click="selectedChartType = 'bar'"
            >
              <i class="bi bi-bar-chart"></i>
            </button>
            <button
                class="btn"
                :class="selectedChartType === 'doughnut' ? 'btn-primary' : 'btn-outline-primary'"
                @click="selectedChartType = 'doughnut'"
            >
              <i class="bi bi-pie-chart"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Диаграмма -->
      <div class="wrapper">
        <template v-if="selectedMonth">
          <BarChart
              v-if="selectedChartType === 'bar'"
              :data="chartData"
              :options="chartOptions"
          />
          <DoughnutChart
              v-else
              :transactions="filteredTransactions"
              :selectedDataset="selectedDataset"
              :categories="categories"
          />
        </template>
        <AlertMessage v-else message="У Вас нет данных для аналитики" />
      </div>
    </div>
  </div>
</template>

<script setup>
import BarChart from '@/components/BarChart.vue'
import DoughnutChart from '@/components/DoughnutChart.vue'
import AlertMessage from '@/components/AlertMessage.vue'

import { useTransactionStore } from '@/stores/useTransactionStore'
import { useWalletStore } from '@/stores/useWalletStore'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import {useCategoryStore} from "@/stores/useCategoryStore.js";

const categoryStore = useCategoryStore()
const { allCategories: categories } = storeToRefs(categoryStore)

// Store refs
const transactionStore = useTransactionStore()
const { transactions, loading, error } = storeToRefs(transactionStore)

const walletStore = useWalletStore()
const { wallets, loading: walletsLoading, error: walletsError } = storeToRefs(walletStore)

// State
const selectedMonth = ref('')
const selectedWalletId = ref(null)
const selectedDataset = ref('income')
const selectedChartType = ref('bar')
const currentIndex = ref(0)

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    transactionStore.fetchTransactions(),
    walletStore.fetchWallets()
  ])

  if (availableMonths.value.length > 0) {
    currentIndex.value = availableMonths.value.length - 1
    selectedMonth.value = availableMonths.value[currentIndex.value].value
  }
})

const availableMonths = computed(() => {
  const months = transactions.value
      .map(tx => tx.date?.slice(0, 7))
      .filter(Boolean)

  const unique = [...new Set(months)].sort()
  return unique.map(m => ({
    value: m,
    label: dayjs(m).locale('ru').format('MMMM YYYY').replace(/^./, c => c.toUpperCase())
  }))
})

const currentMonthLabel = computed(() =>
    availableMonths.value[currentIndex.value]?.label || ''
)

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

const filteredTransactions = computed(() => {
  return transactions.value.filter(tx =>
      tx.date?.startsWith(selectedMonth.value) &&
      (selectedWalletId.value === null || tx.wallet_id === selectedWalletId.value)
  )
})

const dailyData = computed(() => {
  const days = {}

  for (const tx of filteredTransactions.value) {
    const day = tx.date?.slice(8, 10) || '00'
    if (!days[day]) days[day] = { income: 0, expense: 0 }

    if (tx.type === 'income') {
      days[day].income += tx.amount
    } else {
      days[day].expense += tx.amount
    }
  }

  return Object.entries(days)
      .sort((a, b) => a[0] - b[0])
      .map(([day, { income, expense }]) => ({
        day,
        income,
        expense
      }))
})

const chartData = computed(() => ({
  labels: dailyData.value.map(d => d.day),
  datasets: [
    {
      label: selectedDataset.value === 'income' ? 'Доходы' : 'Расходы',
      backgroundColor: selectedDataset.value === 'income' ? '#4caf50' : '#f44336',
      data: dailyData.value.map(d =>
          selectedDataset.value === 'income' ? d.income : -d.expense
      )
    }
  ]
}))

const isMobile = window.innerWidth <= 768

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Доходы и расходы по дням',
      color: '#333',
      font: { size: 18, family: 'Arial', weight: 'bold' },
      padding: { top: 10, bottom: 30 }
    },
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { maxRotation: 0, minRotation: 0 },
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
  width: auto;
  max-width: 100%;
  height: 350px !important;
  margin: 0 auto;
}
.wrapper {
  width: 100%;
  height: auto;
}
</style>
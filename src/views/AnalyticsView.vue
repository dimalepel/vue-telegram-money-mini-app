<template>
  <div>
    <MainHeader title="Аналитика"/>

    <div class="d-flex align-items-center justify-content-center flex-grow-1" v-if="loading || walletsLoading">
      <SvgLoader/>
    </div>

    <p v-if="error">{{ error }}</p>
    <p v-if="walletsError">{{ walletsError }}</p>

    <div class="d-flex flex-grow-1 flex-column" v-if="!loading && !walletsLoading && !error && !walletsError">
      <!-- Месяц и навигация -->
      <div v-if="availableMonths.length > 0" class="d-flex align-items-center mb-3">
        <button class="btn btn-outline-primary me-2" @click="prevMonth" :disabled="currentIndex === 0">
          <i class="bi bi-arrow-left"></i>
        </button>
        <span class="flex-grow-1 text-center fw-bold">{{ currentMonthLabel }}</span>
        <button class="btn btn-outline-primary ms-2" @click="nextMonth" :disabled="currentIndex === availableMonths.length - 1">
          <i class="bi bi-arrow-right"></i>
        </button>
      </div>

      <!-- Фильтры -->
      <div class="row">
        <div class="mb-3 col-12">
          <div class="btn-group w-100 mb-3">
            <button class="btn" :class="selectedDataset === TransactionTypes.EXPENDITURE ? 'btn-primary' : 'btn-outline-primary'" @click="selectedDataset = TransactionTypes.EXPENDITURE">
              Расходы
            </button>
            <button class="btn" :class="selectedDataset === TransactionTypes.INCOME ? 'btn-primary' : 'btn-outline-primary'" @click="selectedDataset = TransactionTypes.INCOME">
              Доходы
            </button>
            <button class="btn" :class="selectedDataset === 'all' ? 'btn-primary' : 'btn-outline-primary'" @click="selectedDataset = 'all'">
              Транзакции
            </button>
          </div>
        </div>

        <div class="mb-3" :class="selectedDataset === 'all' ? 'col-12' : 'col-8'">
          <label for="walletSelect" class="form-label">Депозит:</label>
          <select id="walletSelect" v-model="selectedWalletId" class="form-select">
            <option :value="null">Все депозиты</option>
            <option v-for="wallet in visibleWallets" :key="wallet.id" :value="wallet.id">
              {{ wallet.name }}
            </option>
          </select>
        </div>

        <div class="mb-3 col-4" v-if="selectedDataset === TransactionTypes.INCOME || selectedDataset === TransactionTypes.EXPENDITURE">
          <label class="form-label d-block">&nbsp;</label>
          <div class="btn-group w-100">
            <button class="btn" :class="selectedChartType === 'bar' ? 'btn-primary' : 'btn-outline-primary'" @click="selectedChartType = 'bar'">
              <i class="bi bi-bar-chart"></i>
            </button>
            <button class="btn" :class="selectedChartType === 'doughnut' ? 'btn-primary' : 'btn-outline-primary'" @click="selectedChartType = 'doughnut'">
              <i class="bi bi-pie-chart"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Диаграмма -->
      <div v-if="groupedAnalyticsHistory.length > 0">

        <div class="wrapper">
          <template v-if="selectedMonth">
            <BarChart v-if="selectedChartType === 'bar' && selectedDataset !== 'all'" :data="chartData" :options="chartOptions"/>
            <DoughnutChart v-else-if="selectedChartType === 'doughnut' && selectedDataset !== 'all'" :transactions="filteredTransactionsByType" :selectedDataset="selectedDataset" :categories="categories"/>
          </template>
          <AlertMessage v-else message="У Вас нет данных для аналитики"/>
        </div>

        <!-- Денежный поток -->
        <div v-if="selectedDataset !== 'all'">
          <div class="fw-bold text-primary mt-4 mb-2">Денежный поток:</div>
          <ul class="list-group mb-2 w-100 ps-0  mb-0">
            <li class="d-flex justify-content-between list-group-item">
              <strong><i class="text-success bi bi-arrow-down-circle-fill"></i> Доход:</strong> {{ cashFlow.income }} BYN
            </li>
            <li class="d-flex justify-content-between list-group-item">
              <strong><i class="text-danger bi bi-arrow-up-circle-fill"></i> Расход:</strong> {{ cashFlow.expenditure }} BYN
            </li>
            <li class="d-flex justify-content-between list-group-item">
              <strong>Баланс:</strong> {{ cashFlow.balance }} BYN
            </li>
          </ul>
        </div>


        <!-- История операций -->
        <ul class="w-100 ps-0 mt-2">
          <template v-for="[dateLabel, items] in groupedAnalyticsHistory" :key="dateLabel">
            <li class="fw-bold text-primary py-2">{{ dateLabel }}</li>
            <li v-for="item in items" :key="item.id" class="d-flex align-items-start py-2 border-bottom transaction-card">
              <i v-if="item.type === TransactionTypes.TRANSFER" class="bi me-2 bi-cloud-check-fill text-info transaction-icon"></i>
              <i v-else :class="['bi','me-2',item.amount > 0 ? 'bi-cloud-arrow-down-fill text-success transaction-icon' : 'bi-cloud-arrow-up-fill text-danger transaction-icon']"></i>

              <div class="flex-grow-1">
                <span class="text-secondary">{{ formatDate(item.date) }}</span>
                {{ item.description }}
                <div class="d-flex align-items-center flex-wrap">
                  <strong :class="['me-2', item.type === TransactionTypes.TRANSFER ? 'text-info' : item.amount > 0 ? 'text-success' : 'text-danger']">
                    {{ item.type === TransactionTypes.TRANSFER ? `${item.amount.toFixed(2)}` : item.amount > 0 ? `+${item.amount.toFixed(2)}` : `${item.amount.toFixed(2)}` }} BYN
                  </strong>
                  <span v-if="item.type !== TransactionTypes.TRANSFER" class="category-name"><i :style="`background-color: ${getCategoryById(item.category_id)?.color || '#cccccc'}`"></i> {{ getCategoryById(item.category_id)?.name || '—' }}</span>
                  <span v-if="item.type === TransactionTypes.TRANSFER" class="transfer-detail">{{ getWalletById(item.from_wallet_id)?.name }}<i class="bi bi-arrow-right-short"></i>{{ getWalletById(item.to_wallet_id)?.name }}</span>
                </div>
              </div>

              <button v-if="item.type !== TransactionTypes.TRANSFER" type="button" class="btn btn-outline-danger ms-2" @click="deleteTransaction(item.id)">
                <i class="bi bi-trash"></i>
              </button>
            </li>
          </template>
        </ul>



      </div>

      <div v-else class="d-flex flex-column flex-grow-1">
        <AlertMessage  message="Нет операций в этом месяце"/>

        <button @click="goTo(selectedDataset)" v-if="selectedDataset === TransactionTypes.EXPENDITURE || selectedDataset === TransactionTypes.INCOME" class="btn btn-primary w-100 mt-auto">
          <i class="bi bi-plus-lg me-1"></i> Добавить транзакцию
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, inject} from 'vue'
import {useTransactionStore} from '@/stores/useTransactionStore'
import {useWalletStore} from '@/stores/useWalletStore'
import {useCategoryStore} from '@/stores/useCategoryStore'
import {storeToRefs} from 'pinia'
import { useRouter } from 'vue-router'

import BarChart from '@/components/BarChart.vue'
import DoughnutChart from '@/components/DoughnutChart.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import MainHeader from '@/components/MainHeader.vue'

import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import {TransactionTypes} from "../constants/transactionTypes.js";
import SvgLoader from "@/components/SvgLoader.vue";

dayjs.extend(isSameOrBefore)

const formatDate = inject('formatDate')

const transactionStore = useTransactionStore()
const walletStore = useWalletStore()
const categoryStore = useCategoryStore()
const router = useRouter()

const {transactions, loading, error} = storeToRefs(transactionStore)
const {wallets, loading: walletsLoading, error: walletsError} = storeToRefs(walletStore)
const {allCategories: categories} = storeToRefs(categoryStore)

const {visibleWallets} = storeToRefs(walletStore)

const selectedMonth = ref('')
const selectedWalletId = ref(null)
const selectedDataset = ref(TransactionTypes.EXPENDITURE)
const selectedChartType = ref('bar')
const currentIndex = ref(0)

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    transactionStore.fetchTransactions(),
    walletStore.fetchWallets()
  ])

  const thisMonth = dayjs().format('YYYY-MM')
  const thisMonthIndex = availableMonths.value.findIndex(m => m.value === thisMonth)

  if (thisMonthIndex !== -1) {
    currentIndex.value = thisMonthIndex
    selectedMonth.value = thisMonth
  } else if (availableMonths.value.length > 0) {
    currentIndex.value = availableMonths.value.length - 1
    selectedMonth.value = availableMonths.value[currentIndex.value].value
  } else {
    // Нет данных совсем — но можно установить текущий месяц вручную
    selectedMonth.value = thisMonth
  }
})

const cashFlow = computed(() => {
  let income = 0
  let expenditure = 0

  transactions.value.forEach(tx => {
    // фильтруем по месяцу
    if (!tx.date?.startsWith(selectedMonth.value)) return

    // фильтруем по кошельку (если выбран конкретный)
    if (selectedWalletId.value !== null && tx.wallet_id !== selectedWalletId.value) return

    // считаем доходы и расходы по типу
    if (tx.type === TransactionTypes.INCOME) {
      income += tx.amount
    } else if (tx.type === TransactionTypes.EXPENDITURE) {
      expenditure += Math.abs(tx.amount)
    }
  })

  return {
    income: income.toFixed(2),
    expenditure: expenditure.toFixed(2),
    balance: (income - expenditure).toFixed(2)
  }
})

const availableMonths = computed(() => {
  if (transactions.value.length === 0) {
    // Нет транзакций — показываем только текущий месяц
    const thisMonth = dayjs().format('YYYY-MM')
    return [{
      value: thisMonth,
      label: dayjs(thisMonth).locale('ru').format('MMMM YYYY').replace(/^./, c => c.toUpperCase())
    }]
  }

  const dates = transactions.value
      .map(tx => tx.date?.slice(0, 7))
      .filter(Boolean)
      .sort()

  const firstMonth = dayjs(dates[0])
  const lastTransactionMonth = dayjs(dates[dates.length - 1])
  const thisMonth = dayjs().startOf('month')

  const finalMonth = thisMonth.isAfter(lastTransactionMonth) ? thisMonth : lastTransactionMonth

  const months = []
  let current = firstMonth.clone()

  while (current.isSameOrBefore(finalMonth)) {
    const value = current.format('YYYY-MM')
    const label = current.locale('ru').format('MMMM YYYY').replace(/^./, c => c.toUpperCase())
    months.push({ value, label })
    current = current.add(1, 'month')
  }

  return months
})

function goTo(type) {
  router.push({
    name: 'AddTransaction',
    params: { type },
    query: { amount: 0 }
  })
}

const currentMonthLabel = computed(() => availableMonths.value[currentIndex.value]?.label || '')

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
  if (!selectedMonth.value) return []

  const daysInMonth = dayjs(selectedMonth.value).daysInMonth()
  const result = []
  const txMap = {}

  for (const tx of filteredTransactionsByType.value) {
    const day = dayjs(tx.date).format('DD')

    if (!txMap[day]) txMap[day] = 0
    txMap[day] += tx.amount
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const day = i.toString().padStart(2, '0')
    result.push({
      day,
      amount: txMap[day] || 0
    })
  }

  return result
})

const chartData = computed(() => {
  if (selectedDataset.value === 'all') return null
  return {
    labels: dailyData.value.map(d =>
        dayjs(`${selectedMonth.value}-${d.day}`).format('D dd')
    ),
    datasets: [
      {
        label: selectedDataset.value === TransactionTypes.INCOME ? 'Доходы' : 'Расходы',
        backgroundColor: selectedDataset.value === TransactionTypes.INCOME ? '#4caf50' : '#f44336',
        data: dailyData.value.map(d =>
            selectedDataset.value === TransactionTypes.INCOME ? d.amount : -d.amount
        )
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
      font: {size: 18, family: 'Arial', weight: 'bold'},
      padding: {top: 10, bottom: 30}
    },
    legend: {display: false},
    tooltip: {
      displayColors: false,
      callbacks: {
        title: (tooltipItems) => {
          const item = tooltipItems[0]
          const day = item.raw?.day || item.label.split(' ')[0].padStart(2, '0')
          const fullDate = dayjs(`${selectedMonth.value}-${day}`).format('DD.MM.YY')
          return fullDate // например: "21 июля 2025"
        },
        label: function(context) {
          let label = context.dataset.label || '';
          let value = context.parsed.y;

          if (typeof value === 'number') {
            value = value.toFixed(2); // округление
          }

          return `${value} BYN`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {display: false},
      ticks: {maxRotation: 0, minRotation: 0},
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

const filteredTransactionsByType = computed(() => {
  if (selectedDataset.value === 'all') {
    return filteredTransactions.value
  }

  return filteredTransactions.value.filter(tx => {
    if (tx.type === TransactionTypes.TRANSFER) return false

    if (selectedDataset.value === TransactionTypes.INCOME) {
      return tx.type === TransactionTypes.INCOME
    }

    if (selectedDataset.value === TransactionTypes.EXPENDITURE) {
      return tx.type === TransactionTypes.EXPENDITURE
    }

    return false
  })
})

const groupedAnalyticsHistory = computed(() => {
  const groups = {}

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const isSameDate = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()

  filteredTransactionsByType.value.forEach(tx => {
    const txDate = new Date(tx.date)
    let label

    if (isSameDate(txDate, today)) {
      label = 'Сегодня'
    } else if (isSameDate(txDate, yesterday)) {
      label = 'Вчера'
    } else {
      label = txDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    if (!groups[label]) {
      groups[label] = []
    }
    groups[label].push(tx)
  })

  return Object.entries(groups).sort((a, b) => {
    const getFirstDate = group => new Date(group[1][0].date)
    return getFirstDate(b) - getFirstDate(a)
  })
})

function getCategoryById(id) {
  return categoryStore.categories.find(cat => cat.id === id)
}

function deleteTransaction(id) {
  if (confirm('Удалить транзакцию?')) {
    transactionStore.deleteTransaction(id)
  }
}

function getWalletById(id) {
  return walletStore.wallets.find(w => w.id === id)
}
</script>

<style scoped>
:deep(canvas) {
  width: 100%;
  max-width: 100%;
  height: 50vh;
  max-height: 450px !important;
  margin: 0 auto;
}

.wrapper {
  width: 100%;
  height: auto;
}

.row {
  --bs-gutter-x: 0.5rem;
}

.btn-outline-danger {
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
}

.transaction-icon {
  font-size: 1.5rem;
}

.category-name {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #b5afaf;
}

.category-name i {
  width: 0.75rem;
  height: 0.75rem;
  margin-right: 0.3rem;
  background-color: red;
  border-radius: 100%;
}

.transfer-detail {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #b5afaf;
}

.transfer-detail i {
  margin-left: 0.2rem;
  margin-right: 0.2rem;
}
</style>

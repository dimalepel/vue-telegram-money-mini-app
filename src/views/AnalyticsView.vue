<template>
  <div>
    <MainHeader title="Аналитика"/>

    <div class="d-flex align-items-center justify-content-center flex-grow-1" v-if="loading || walletsLoading">
      <SvgLoader/>
    </div>

    <p v-if="error">{{ error }}</p>
    <p v-if="walletsError">{{ walletsError }}</p>

    <div class="d-flex flex-grow-1 flex-column" v-if="!loading && !walletsLoading && !error && !walletsError">

      <!-- Выбор периода (кнопка) -->
      <div class="d-flex align-items-center justify-content-between mb-3">

      </div>

      <!-- Навигация по периодам -->
      <div class="d-flex align-items-center mb-3">
        <button v-if="selectedPeriod !== 'all'" class="btn btn-outline-primary me-2" @click="prevPeriod">
          <i class="bi bi-arrow-left"></i>
        </button>
        <button class="btn btn-outline-primary w-100" @click="showPeriodModal = true">
          <i class="bi bi-calendar3 me-2"></i>{{ currentPeriodLabel }}
        </button>
        <button v-if="selectedPeriod !== 'all'" class="btn btn-outline-primary ms-2" @click="nextPeriod">
          <i class="bi bi-arrow-right"></i>
        </button>
      </div>

      <!-- Модальное окно выбора периода -->
      <div v-if="showPeriodModal" class="modal-backdrop-custom">
        <div class="modal-custom">
          <div class="modal-header">
            <h5 class="modal-title">Выбор периода</h5>
            <button type="button" class="btn-close" @click="showPeriodModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Период:</label>
              <select v-model="selectedPeriod" class="form-select" @change="currentOffset = 0">
                <option v-for="option in periodOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <!--            <div v-if="selectedPeriod === 'week'" class="mb-3">-->
            <!--              <label class="form-label">Первый день недели:</label>-->
            <!--              <select v-model="firstDayOfWeek" class="form-select">-->
            <!--                <option v-for="(name, value) in weekDays" :key="value" :value="value">{{ name }}</option>-->
            <!--              </select>-->
            <!--            </div>-->
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showPeriodModal = false">Закрыть</button>
          </div>
        </div>
      </div>

      <!-- Фильтры -->
      <div class="row">
        <div class="mb-3 col-12 btn-group w-100">
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
              <strong><i class="text-success bi bi-arrow-down-circle-fill"></i> Доход:</strong> {{ cashFlow.income }} {{ getCurrencyDisplay(defaultCurrency) }}
            </li>
            <li class="d-flex justify-content-between list-group-item">
              <strong><i class="text-danger bi bi-arrow-up-circle-fill"></i> Расход:</strong> {{ cashFlow.expenditure }} {{ getCurrencyDisplay(defaultCurrency) }}
            </li>
            <li class="d-flex justify-content-between list-group-item">
              <strong>Баланс:</strong> {{ cashFlow.balance }} {{ getCurrencyDisplay(defaultCurrency) }}
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
                    {{ item.type === TransactionTypes.TRANSFER ? `${item.amount.toFixed(2)}` : item.amount > 0 ? `+${item.amount.toFixed(2)}` : `${item.amount.toFixed(2)}` }} {{ getCurrencyDisplay(getCurrencyByWalletId(item.wallet_id)) }}
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
        <AlertMessage message="Нет операций в этом периоде"/>

        <button @click="goTo(selectedDataset)" v-if="selectedDataset === TransactionTypes.EXPENDITURE || selectedDataset === TransactionTypes.INCOME" class="btn btn-primary w-100 mt-auto">
          <i class="bi bi-plus-lg me-1"></i> Добавить транзакцию
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, inject} from 'vue'
import {storeToRefs} from 'pinia'
import {useRouter} from 'vue-router'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'

import {useTransactionStore} from '@/stores/useTransactionStore'
import {useWalletStore} from '@/stores/useWalletStore'
import {useCategoryStore} from '@/stores/useCategoryStore'
import {useSettingsStore} from "@/stores/useSettingsStore";
import {useUserStore} from "@/stores/useUserStore";

import BarChart from '@/components/BarChart.vue'
import DoughnutChart from '@/components/DoughnutChart.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import MainHeader from '@/components/MainHeader.vue'
import SvgLoader from "@/components/SvgLoader.vue";

import {TransactionTypes} from "../constants/transactionTypes.js";

import isBetween from 'dayjs/plugin/isBetween'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isBetween)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const transactionStore = useTransactionStore()
const settingsStore = useSettingsStore()
const walletStore = useWalletStore()
const categoryStore = useCategoryStore()
const userStore = useUserStore()

const formatDate = inject('formatDate')
const router = useRouter()

const showPeriodModal = ref(false)
const selectedPeriod = ref('month') // today, week, month, year, all
const currentOffset = ref(0)

const {transactions, loading, error} = storeToRefs(transactionStore)
const {loading: walletsLoading, error: walletsError} = storeToRefs(walletStore)
const {allCategories: categories} = storeToRefs(categoryStore)

const {visibleWallets} = storeToRefs(walletStore)

const selectedMonth = ref('')
const selectedWalletId = ref(null)
const selectedDataset = ref(TransactionTypes.EXPENDITURE)
const selectedChartType = ref('bar')
const currentIndex = ref(0)


const periodOptions = [
  {value: 'today', label: 'Сегодня'},
  {value: 'week', label: 'Эта неделя'},
  {value: 'month', label: 'Этот месяц'},
  {value: 'year', label: 'Этот год'},
  {value: 'all', label: 'Всё время'}
]

// const weekDays = {
//   0: 'Воскресенье',
//   1: 'Понедельник',
//   2: 'Вторник',
//   3: 'Среда',
//   4: 'Четверг',
//   5: 'Пятница',
//   6: 'Суббота'
// }

const firstDayOfWeek = computed(() => {
  return settingsStore.settings?.first_day_of_week ?? 1
})

const periodRange = computed(() => {
  const today = dayjs()
  switch (selectedPeriod.value) {
    case 'today': {
      const date = today.add(currentOffset.value, 'day')
      return {start: date.startOf('day'), end: date.endOf('day')}
    }
    case 'week': {
      const todayDate = today.add(currentOffset.value * 7, 'day')

      // Вычисляем сдвиг, чтобы первый день недели был firstDayOfWeek
      // dayjs().day() возвращает день недели 0..6 (воскресенье - суббота)
      const dayOfWeek = todayDate.day()
      const diff = (dayOfWeek < firstDayOfWeek.value)
          ? (dayOfWeek + 7 - firstDayOfWeek.value)
          : (dayOfWeek - firstDayOfWeek.value)

      const start = todayDate.subtract(diff, 'day').startOf('day')
      const end = start.add(6, 'day').endOf('day')

      return {start, end}
    }
    case 'month': {
      const date = today.add(currentOffset.value, 'month').startOf('month')
      return {start: date, end: date.endOf('month')}
    }
    case 'year': {
      const date = today.add(currentOffset.value, 'year').startOf('year')
      return {start: date, end: date.endOf('year')}
    }
    default:
      return {
        start: dayjs(userStore.createdAt).startOf('day'),
        end: today.endOf('day')
      }
  }
})

const currentPeriodLabel = computed(() => {
  const {start, end} = periodRange.value
  if (!start || !end) return 'Все транзакции'

  if (selectedPeriod.value === 'today') {
    return start.format('D MMMM YYYY')
  }
  if (selectedPeriod.value === 'week') {
    return `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`
  }
  if (selectedPeriod.value === 'month') {
    return start.format('MMMM YYYY').replace(/^./, c => c.toUpperCase())
  }
  if (selectedPeriod.value === 'year') {
    return start.format('YYYY')
  }
  return `${start.format('D MMM YYYY')} – ${end.format('D MMM YYYY')}`
})

const defaultCurrency = computed(() => {
  if (selectedWalletId.value) {
    return getCurrencyByWalletId(selectedWalletId.value)
  }
  return 'BYN'
})

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

  const {start, end} = periodRange.value

  transactions.value.forEach(tx => {
    // фильтруем по периоду
    if (start && end) {
      const txDate = dayjs(tx.date)
      if (txDate.isBefore(start) || txDate.isAfter(end)) return
    }

    // фильтруем по кошельку
    if (selectedWalletId.value !== null && tx.wallet_id !== selectedWalletId.value) return

    // считаем доходы и расходы
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

function getCurrencyByWalletId(walletId) {
  const wallet = walletStore.wallets.find(w => w.id === walletId);
  return wallet?.currency || 'BYN';  // дефолт если не задана валюта
}

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
    months.push({value, label})
    current = current.add(1, 'month')
  }

  return months
})

function prevPeriod() {
  currentOffset.value--
}

function nextPeriod() {
  currentOffset.value++
}

function goTo(type) {
  router.push({
    name: 'AddTransaction',
    params: {type},
    query: {amount: 0}
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
  return transactions.value.filter(tx => {
    // фильтр по депозиту
    if (selectedWalletId.value !== null && tx.wallet_id !== selectedWalletId.value) {
      return false
    }

    // фильтр по периоду (если не "all")
    const {start, end} = periodRange.value
    if (start && end) {
      const txDate = dayjs(tx.date)
      if (!txDate.isBetween(start, end, null, '[]')) {
        return false
      }
    }

    return true
  })
})

const aggregatedData = computed(() => {
  if (!periodRange.value.start || !periodRange.value.end) return [];

  const start = dayjs(periodRange.value.start);
  const end = dayjs(periodRange.value.end);

  // Проверяем, больше ли выбранный период 1 месяца
  const useMonthly = end.diff(start, 'month', true) > 1;

  const txMap = {};

  for (const tx of filteredTransactionsByType.value) {
    const txDate = dayjs(tx.date);
    if (txDate.isBefore(start) || txDate.isAfter(end)) continue;

    // Ключ группировки
    const key = useMonthly ? txDate.format('YYYY-MM') : txDate.format('YYYY-MM-DD');

    if (!txMap[key]) txMap[key] = 0;
    txMap[key] += tx.amount;
  }

  const result = [];
  let current = start;

  while (current.isSameOrBefore(end, useMonthly ? 'month' : 'day')) {
    const key = useMonthly ? current.format('YYYY-MM') : current.format('YYYY-MM-DD');
    result.push({
      key,
      amount: txMap[key] || 0,
    });
    current = current.add(1, useMonthly ? 'month' : 'day');
  }

  return {data: result, useMonthly};
});

const chartData = computed(() => {
  if (selectedDataset.value === 'all') return null;

  const {data, useMonthly} = aggregatedData.value;

  return {
    labels: data.map(d =>
        useMonthly
            ? dayjs(d.key).format('MMM YYYY')    // Авг 2025
            : dayjs(d.key).format('D dd')        // 7 чт
    ),
    datasets: [
      {
        label: selectedDataset.value === TransactionTypes.INCOME ? 'Доходы' : 'Расходы',
        backgroundColor: selectedDataset.value === TransactionTypes.INCOME ? '#4caf50' : '#f44336',
        data: data.map(d =>
            selectedDataset.value === TransactionTypes.INCOME ? d.amount : -d.amount
        )
      }
    ]
  };
});

const isMobile = window.innerWidth <= 768

const currency = transactions.length > 0 ? transactions[0].currency : 'BYN';

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
          const item = tooltipItems[0];
          const label = item.label;
          const day = item.raw?.day || item.label.split(' ')[0].padStart(2, '0')

          // Если метка — дата в формате YYYY-MM-DD (день)
          if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
            return dayjs(label).format('DD.MM.YY');
          }

          // Если метка — месяц в формате YYYY-MM
          if (/^\d{4}-\d{2}$/.test(label)) {
            return dayjs(label, 'YYYY-MM').format('MMMM YYYY'); // например, "Июнь 2025"
          }

          // Если метка — год в формате YYYY
          if (/^\d{4}$/.test(label)) {
            return label; // просто год, например, "2025"
          }

          if (/^\d{1,2}$/.test(day)) {
            return dayjs(`${selectedMonth.value}-${day.padStart(2, '0')}`).format('DD.MM.YY');
          }

          // Если что-то непредвиденное — просто возвращаем label
          return label;
        },
        label: (context) => {
          let label = context.dataset.label || '';
          let value = context.parsed.y;

          if (typeof value === 'number') {
            value = value.toFixed(2);
          }

          return `${value} ${getCurrencyDisplay(currency)}`;
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

const getCurrencyDisplay = (code) => {
  const currency = settingsStore.currencies.find(c => c.code === code)
  return currency ? `${currency.symbol}` : code
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

.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-custom {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
}
</style>

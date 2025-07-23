<script setup>
import {inject, ref, onMounted, computed} from 'vue'
import {useTransactionStore} from '@/stores/useTransactionStore'
import {useWalletStore} from '@/stores/useWalletStore'
import {storeToRefs} from 'pinia'
import AlertMessage from "@/components/AlertMessage.vue";
import MainHeader from "@/components/MainHeader.vue";
import {TransactionTypes} from "@/constants/transactionTypes";
import { useCategoryStore } from '@/stores/useCategoryStore'

const transactionStore = useTransactionStore()
const walletStore = useWalletStore()
const formatDate = inject('formatDate')

const {transactions, loading, error} = storeToRefs(transactionStore)
const {wallets} = storeToRefs(walletStore)

const selectedWalletId = ref('')
const categoryStore = useCategoryStore()

onMounted(() => {
  transactionStore.fetchTransactions()
  walletStore.fetchWallets?.()
  categoryStore.fetchCategories?.()
})

const filteredHistory = computed(() => {
  let filtered = transactions.value
  if (selectedWalletId.value) {
    filtered = filtered.filter(tx => tx.wallet_id === selectedWalletId.value)
  }
  return filtered.slice().sort((a, b) => new Date(b.date) - new Date(a.date))
})

const groupedHistory = computed(() => {
  const groups = {}

  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isSameDate = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()

  filteredHistory.value.forEach(tx => {
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

function deleteTransaction(id) {
  if (confirm('Удалить транзакцию?')) {
    transactionStore.deleteTransaction(id)
  }
}

function getCategoryById(id) {
  console.log(categoryStore.categories.find(cat => cat.id === id))
  return categoryStore.categories.find(cat => cat.id === id)
}
</script>

<template>
  <div>
    <MainHeader title="История операций"/>

    <p v-if="loading">Загрузка...</p>
    <p v-if="error">{{ error }}</p>

    <div v-if="!loading && !error">
      <select v-if="wallets.length > 0" v-model="selectedWalletId" class="form-select mb-3">
        <option value="">Все депозиты</option>
        <option :value="item.id" v-for="item in wallets" :key="item.id">
          {{ item.name }}
        </option>
      </select>

      <ul class="w-100 ps-0" v-if="groupedHistory.length > 0">
        <template v-for="[dateLabel, items] in groupedHistory" :key="dateLabel">
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
              </div>
            </div>

            <button v-if="item.type !== TransactionTypes.TRANSFER" type="button" class="btn btn-outline-danger ms-2" @click="deleteTransaction(item.id)">
              <i class="bi bi-trash"></i>
            </button>
          </li>
        </template>
      </ul>

      <AlertMessage v-else message="У Вас нет доступных операций"/>
    </div>
  </div>
</template>

<style scoped>
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
</style>
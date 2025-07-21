<script setup>
import { inject, ref, onMounted, computed } from 'vue'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useWalletStore } from '@/stores/useWalletStore'
import { storeToRefs } from 'pinia'
import AlertMessage from "@/components/AlertMessage.vue";
import MainHeader from "@/components/MainHeader.vue";

const transactionStore = useTransactionStore()
const walletStore = useWalletStore()
const formatDate = inject('formatDate')

const { transactions, loading, error } = storeToRefs(transactionStore)
const { wallets } = storeToRefs(walletStore)

const selectedWalletId = ref('')

onMounted(() => {
  transactionStore.fetchTransactions()
  walletStore.fetchWallets?.()
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
</script>

<template>
  <div>
    <MainHeader title="История операций" />

    <p v-if="loading">Загрузка...</p>
    <p v-if="error">{{ error }}</p>

    <div v-if="!loading && !error">
      <select
          v-if="wallets.length > 0"
          v-model="selectedWalletId"
          class="form-select mb-3"
      >
        <option value="">Все депозиты</option>
        <option
            :value="item.id"
            v-for="item in wallets"
            :key="item.id"
        >
          {{ item.name }}
        </option>
      </select>

      <ul class="w-100 ps-0" v-if="groupedHistory.length > 0">
        <template
            v-for="[dateLabel, items] in groupedHistory"
            :key="dateLabel"
        >
          <li class="fw-bold text-primary py-2">{{ dateLabel }}</li>

          <li
              v-for="item in items"
              :key="item.id"
              class="d-flex align-items-start py-2 border-bottom"
          >
            <i
                :class="[
                'bi',
                'me-2',
                item.amount > 0
                  ? 'bi-arrow-down-left-circle-fill text-success'
                  : 'bi-arrow-up-right-circle-fill text-danger'
              ]"
            ></i>

            <div class="flex-grow-1">
              <span class="text-secondary">{{ formatDate(item.date) }}</span>
              {{ item.description }}<br />
              <strong
                  :class="item.amount > 0 ? 'text-success' : 'text-danger'"
              >
                {{ item.amount > 0 ? `+${item.amount.toFixed(2)}` : `${item.amount.toFixed(2)}` }} BYN
              </strong>
            </div>

            <button
                type="button"
                class="btn btn-outline-danger ms-2"
                @click="deleteTransaction(item.id)"
            >
              <i class="bi bi-trash"></i>
            </button>
          </li>
        </template>
      </ul>

      <AlertMessage v-else message="У Вас нет доступных операций" />
    </div>
  </div>
</template>

<style scoped>
.btn-outline-danger {
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
}
</style>
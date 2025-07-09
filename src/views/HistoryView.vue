<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useWalletStore } from '@/stores/useWalletStore'
import { storeToRefs } from 'pinia'

const transactionStore = useTransactionStore()
const walletStore = useWalletStore()

const { transactions, loading, error } = storeToRefs(transactionStore)
const { wallets } = storeToRefs(walletStore)

const selectedWalletId = ref('')

onMounted(() => {
  transactionStore.fetchTransactions()
  walletStore.fetchWallets?.() // если есть такой метод
})

const filteredHistory = computed(() => {
  if (!selectedWalletId.value) return transactions.value
  return transactions.value.filter(tx => tx.wallet_id === selectedWalletId.value)
})
</script>

<template>
  <div>
    <h1 class="w-100 mb-3 text-center">История операций</h1>

    <p v-if="loading">Загрузка...</p>
    <p v-if="error">{{ error }}</p>
    <div v-if="!loading && !error">
      <select v-if="wallets.length > 0" v-model="selectedWalletId" class="form-select mb-3">
        <option value="">Все депозиты</option>
        <option :value="item.id" v-for="item in wallets" :key="item.id">{{ item.name }}</option>
      </select>
      <ul class="w-100 ps-0" v-if="filteredHistory.length > 0">
        <li class="d-flex py-2 border-bottom" v-for="item in filteredHistory" :key="item.id">
          <i :class="['bi', 'me-2', (item.amount > 0) ? 'bi-arrow-down-left-circle-fill text-success' : 'bi-arrow-up-right-circle-fill text-danger']"></i>
          <div class="flex-grow-1">
            <span class="text-secondary">{{ item.date }}</span> {{ item.description }}<br>
            <strong :class="(item.amount > 0) ? 'text-success' : 'text-danger'">{{ (item.amount > 0) ? `+${item.amount}` : `${item.amount}` }} BYN</strong>
          </div>
        </li>
      </ul>
      <div v-else class="alert alert-warning" role="alert">
        У Вас нет доступных операций
      </div>
    </div>
  </div>
</template>
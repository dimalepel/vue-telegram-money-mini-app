<script setup>
import { onMounted } from 'vue'
import { useWalletStore } from '../../stores/useWalletStore'
import { storeToRefs } from "pinia";

const walletStore = useWalletStore()
const { wallets, loading, error } = storeToRefs(walletStore)
const { fetchWallets } = walletStore

onMounted(() => {
  fetchWallets()
})
</script>

<template>
  <div>
    <h1 class="w-100 mb-3 text-center">Депозиты</h1>
    <p v-if="loading">Загрузка...</p>
    <p v-if="error">{{ error }}</p>

    <div v-if="!loading && !error">
      <ul v-if="wallets.length > 0" class="w-100 ps-0" >
        <li class="d-flex p-2 mb-3 border rounded align-items-start" v-for="item in wallets">
          <i :class="['bi', 'fs-2', 'me-2', 'lh-1', 'text-primary', `bi-${item['wallet-type'].type}`]"></i>
          <div class="flex-grow-1">
            <div class="mb-1">{{ item.name }}</div>
            <div class="mb-1">Текущий баланс: <strong>{{ item.balance.toFixed(2) }} BYN</strong></div>
          </div>
        </li>
      </ul>
      <div v-else class="alert alert-warning" role="alert">
        У Вас нет доступных депозитов
      </div>
    </div>

    <router-link to="/wallet/add-wallet" class="btn btn-success mt-auto">Новый депозит</router-link>
  </div>
</template>

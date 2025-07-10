<script setup>
import { onMounted } from 'vue'
import { useWalletStore } from '../../stores/useWalletStore'
import { storeToRefs } from "pinia";
import AlertMessage from "@/components/AlertMessage.vue";
import MainHeader from "@/components/MainHeader.vue";

const walletStore = useWalletStore()
const { wallets, loading, error } = storeToRefs(walletStore)
const { fetchWallets } = walletStore

onMounted(() => {
  fetchWallets()
})
</script>

<template>
  <div>
    <MainHeader title="Депозиты"/>
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
      <AlertMessage v-else message="У Вас нет доступных депозитов" />
    </div>

    <router-link to="/wallet/add-wallet" class="btn btn-success mt-auto">
      <i class="bi bi-plus-lg me-1"></i> Новый депозит
    </router-link>
  </div>
</template>

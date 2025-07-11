<script setup>
import {onMounted, ref} from 'vue'
import { useWalletStore } from '../../stores/useWalletStore'
import { storeToRefs } from "pinia";
import AlertMessage from "@/components/AlertMessage.vue";
import MainHeader from "@/components/MainHeader.vue";
import DeleteWalletModal from "@/components/DeleteWalletModal.vue";

const walletStore = useWalletStore()
const { wallets, loading, error } = storeToRefs(walletStore)
const { fetchWallets } = walletStore

const showModal = ref(false)
const selectedWalletId = ref(null)

async function handleModalClose(option) {
  showModal.value = false

  if (option === 'cancel' || !selectedWalletId.value) {
    selectedWalletId.value = null
    return
  }

  try {
    await walletStore.deleteWallet(selectedWalletId.value, option)
  } catch (err) {
    alert('Ошибка при удалении депозита')
  } finally {
    selectedWalletId.value = null
  }
}

function openModal(walletId) {
  selectedWalletId.value = walletId
  showModal.value = true
}

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

          <button type="button" class="btn btn-outline-danger ms-2" @click="openModal(item.id)">
            <i class="bi bi-trash"></i>
          </button>
        </li>
      </ul>
      <AlertMessage v-else message="У Вас нет доступных депозитов" />

      <DeleteWalletModal :show="showModal" @close="handleModalClose" />
    </div>

    <router-link to="/wallet/add-wallet" class="btn btn-success mt-auto">
      <i class="bi bi-plus-lg me-1"></i> Новый депозит
    </router-link>
  </div>
</template>

<style scoped>
.btn-outline-danger {
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
}
</style>

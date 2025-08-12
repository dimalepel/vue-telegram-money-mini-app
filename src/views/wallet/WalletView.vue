<script setup>
import {computed, onMounted, ref} from 'vue'
import { useWalletStore } from '@/stores/useWalletStore'
import { storeToRefs } from "pinia";
import AlertMessage from "@/components/AlertMessage.vue";
import MainHeader from "@/components/MainHeader.vue";
import DeleteWalletModal from "@/components/DeleteWalletModal.vue";
import SvgLoader from "@/components/SvgLoader.vue";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {useExchangeRatesStore} from "@/stores/useExchangeRatesStore";

const walletStore = useWalletStore()
const settingsStore = useSettingsStore()
const exchangeRatesStore = useExchangeRatesStore()

exchangeRatesStore.loadExchangeRates()

const { wallets, loading, error } = storeToRefs(walletStore)
const { fetchWallets } = walletStore

const showArchived = computed(() => settingsStore.settings.show_archived_data === true)

const visibleWallets = computed(() => {
  return showArchived.value
      ? wallets.value
      : wallets.value.filter(w => !w.is_archived)
})

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

function formatNumberWithSpaces(num) {
  const str = typeof num === 'number' ? num.toString() : num;
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

// function formatConvertedBalance(item) {
//   const converted = this.settingsStore.convertCurrency(
//       Number(item.balance),
//       item.currency,
//       this.settingsStore.settings.currency
//   );
//
//   return converted.toFixed(2);
// }

const getCurrencyDisplay = (code) => {
  const currency = settingsStore.currencies.find(c => c.code === code)
  return currency ? `${currency.symbol}` : code
}

onMounted(() => {
  fetchWallets()
})
</script>

<template>
  <div>
    <MainHeader title="Депозиты"/>

    <div class="d-flex align-items-center justify-content-center flex-grow-1" v-if="loading">
      <SvgLoader />
    </div>
    <p v-if="error">{{ error }}</p>

    <div class="flex-grow-1 d-flex flex-column" v-if="!loading && !error">
      <ul v-if="visibleWallets.length > 0" class="w-100 mb-0 ps-0" >
        <li :class="['d-flex p-2 mb-3 border rounded align-items-start', item.is_archived ? 'bg-border-color' : '']" v-for="item in visibleWallets">
          <i :class="['bi', 'fs-2', 'me-2', 'lh-1', 'text-primary', `bi-${item['wallet-type'].type}`]"></i>
          <div class="flex-grow-1">
            <div class="mb-1">{{ item.name }}</div>
            <div class="mb-1">
              Баланс: <strong>{{ formatNumberWithSpaces(Number(item.balance).toFixed(2)) }} {{ getCurrencyDisplay(item.currency || 'BYN') }}
              <span v-if="item.currency !== settingsStore.settings.currency" class="text-black-50 converted-balance">
                ({{ formatNumberWithSpaces(exchangeRatesStore.convertToDefaultCurrency(Number(item.balance), item.currency, settingsStore.settings.currency).toFixed(2)) }} {{ getCurrencyDisplay(settingsStore.settings.currency) }})
              </span>
            </strong></div>
          </div>

          <router-link class="btn btn-outline-primary ms-2" :to="`/wallet/edit/${item.id}`">
            <i class="bi bi-pencil"></i>
          </router-link>

          <button type="button" class="btn btn-outline-danger ms-2" @click="openModal(item.id)">
            <i class="bi bi-trash"></i>
          </button>
        </li>
      </ul>
      <AlertMessage v-else message="У Вас нет доступных депозитов" />

      <router-link to="/wallet/add-wallet" class="btn btn-success mt-auto">
        <i class="bi bi-plus-lg me-1"></i> Новый депозит
      </router-link>

      <DeleteWalletModal :show="showModal" @close="handleModalClose" />
    </div>
  </div>
</template>

<style scoped>
.btn-outline-primary,
.btn-outline-danger {
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
}

.bg-border-color {
  background-color: var(--bs-border-color);
}

.converted-balance {
  font-size: 0.75rem;
}
</style>

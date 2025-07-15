<script setup>
import {ref, onMounted, computed, watch} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useWalletStore } from '@/stores/useWalletStore'
import { useUserStore } from '@/stores/useUserStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import MainHeader from "@/components/MainHeader.vue";
import { TransactionTypes } from '@/constants/transactionTypes'
import dayjs from 'dayjs'
import Flatpickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Russian } from 'flatpickr/dist/l10n/ru.js'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)
import * as bootstrap from 'bootstrap'
import AddCategoryModal from "@/views/settings/AddCategoryModal.vue";

const amount = ref('')
const date = ref(new Date())
const config = {
  locale: Russian,
  dateFormat: 'd.m.Y',
  mode: 'single',
}
const description = ref('')
const walletId = ref('')
const categoryId = ref('')
const router = useRouter()
const route = useRoute()

const transactionStore = useTransactionStore()
const walletStore = useWalletStore()
const userStore = useUserStore()
const categoryStore = useCategoryStore()

const isIncome = ref(route.params.type === TransactionTypes.INCOME)

walletStore.fetchWallets?.()
categoryStore.fetchCategories?.()

onMounted(() => {
  if (route.query.amount) {
    amount.value = route.query.amount
  }

  if (modalRef.value && modalRef.value.modalEl) { // modalEl из defineExpose
    modalInstance = new bootstrap.Modal(modalRef.value.modalEl)
  }
})

watch(amount, (newVal) => {
  let cleaned = String(newVal)
      .replace(',', '.')
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1') // Только одна точка

  const match = cleaned.match(/^(\d+)(\.(\d{0,2})?)?/)
  amount.value = match ? match[1] + (match[2] || '') : ''
})

// Отфильтрованные категории по типу
const filteredCategories = computed(() =>
    categoryStore.categories.filter(cat => cat.type === (isIncome.value ? TransactionTypes.INCOME : TransactionTypes.EXPENDITURE))
)

// ========== Модалка для добавления ==========
const modalRef = ref(null)
let modalInstance = null

const newCategoryName = ref('')

function openAddModal() {
  newCategoryName.value = ''
  if (modalInstance) {
    modalInstance.show()
  }
}

async function onSaveCategory(name) {
  await categoryStore.createCategory(name, isIncome.value ? TransactionTypes.INCOME : TransactionTypes.EXPENDITURE)
  modalInstance.hide()
}

const handleSubmit = async () => {
  if (!amount.value || !date.value || !walletId.value || !categoryId.value) return
  let parsedDate = Array.isArray(date.value) ? date.value[0] : date.value
  if (!(parsedDate instanceof Date)) {
    parsedDate = dayjs(date.value, 'DD.MM.YYYY').toDate()
  }
  const dateForSaving = parsedDate.toISOString()

  try {
    await transactionStore.addTransaction({
      amount: isIncome.value ? Number(amount.value) : -Number(amount.value),
      date: dateForSaving, // ← ISO 8601 (UTC)
      description: description.value,
      type: isIncome.value ? TransactionTypes.INCOME : TransactionTypes.EXPENDITURE,
      user_id: userStore.id,
      wallet_id: Number(walletId.value),
      category_id: Number(categoryId.value),
    })

    const delta = isIncome.value ? Number(amount.value) : -Number(amount.value)
    await walletStore.updateWalletBalance(Number(walletId.value), delta)

    router.push('/history')
  } catch (e) {
    console.error('Ошибка при добавлении операции:', e)
  }
}
</script>

<template>
  <div class="text-center position-relative">
    <router-link to="/add-record" class="btn-close position-absolute" aria-label="Закрыть" />

    <MainHeader :title="`${ isIncome ? 'Доход' : 'Расход' }`"/>

    <form @submit.prevent="handleSubmit" class="flex-grow-1 d-flex flex-column">
      <div class="mb-3">
        <label class="form-label">Сумма</label>
        <input v-model="amount" type="text" class="form-control" placeholder="Введите сумму" />
      </div>

      <div class="mb-3">
        <label class="form-label">Дата</label>
        <Flatpickr v-model="date" :config="config" class="form-control" />
      </div>

      <div class="mb-3">
        <label class="form-label">Депозит</label>
        <select v-model="walletId" class="form-select">
          <option value="">Выберите депозит</option>
          <option :value="wallet.id" v-for="wallet in walletStore.wallets" :key="wallet.id">
            {{ wallet.name }}
          </option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">Категория</label>
        <div class="row">
          <div class="col-9">
            <select v-model="categoryId" class="form-select">
              <option value="">Выберите категорию</option>
              <option :value="cat.id" v-for="cat in filteredCategories" :key="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="col-3">
            <button type="button" class="btn btn-outline-success w-100"  @click="openAddModal">
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>
        </div>

      </div>

      <div class="mb-3">
        <label class="form-label">Комментарий</label>
        <textarea v-model="description" class="form-control" />
      </div>

      <button type="submit" class="btn btn-primary w-100 mt-auto">Сохранить</button>
    </form>

    <!-- Модальное окно -->
    <AddCategoryModal
        ref="modalRef"
        @save="onSaveCategory"
    />

  </div>
</template>
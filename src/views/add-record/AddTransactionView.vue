<script setup>
import {ref, onMounted, computed, watch} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useTransactionStore} from '@/stores/useTransactionStore'
import {useWalletStore} from '@/stores/useWalletStore'
import {useUserStore} from '@/stores/useUserStore'
import {useCategoryStore} from '@/stores/useCategoryStore'
import MainHeader from "@/components/MainHeader.vue";
import {TransactionTypes} from '@/constants/transactionTypes'
import {CurrenciesList} from "@/constants/currenciesList"
import dayjs from 'dayjs'
import Flatpickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import {Russian} from 'flatpickr/dist/l10n/ru.js'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)
import * as bootstrap from 'bootstrap'
import AddCategoryModal from "@/views/settings/AddCategoryModal.vue";
import {useSettingsStore} from '@/stores/useSettingsStore'
import {storeToRefs} from "pinia";

const amount = ref('')
const date = ref(new Date())
const config = {
  locale: Russian,
  dateFormat: 'd.m.Y',
  mode: 'single',
}
const originalAmount = ref('')
const description = ref('')
const walletId = ref('')
const categoryId = ref('')
const splitItems = ref([])

const router = useRouter()
const route = useRoute()

const transactionStore = useTransactionStore()
const walletStore = useWalletStore()
const userStore = useUserStore()
const categoryStore = useCategoryStore()
const settingsStore = useSettingsStore()

const {visibleWallets} = storeToRefs(walletStore)

const isIncome = ref(route.params.type === TransactionTypes.INCOME)
const isTransfer = ref(route.params.type === TransactionTypes.TRANSFER)
const selectedCurrency = ref(settingsStore.settings.currency || 'BYN')

const fromWalletId = ref('')
const toWalletId = ref('')

const transactionTitle = computed(() => {
  if (isTransfer.value) return 'Перевод'
  return isIncome.value ? 'Доход' : 'Расход'
})

watch(amount, (newVal) => {
  // очистка и валидация как у тебя уже есть
  let cleaned = String(newVal)
      .replace(',', '.')
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1')

  const match = cleaned.match(/^(\d+)(\.(\d{0,2})?)?/)
  amount.value = match ? match[1] + (match[2] || '') : ''

  // Сохраняем оригинальную сумму, если еще пусто
  if (!originalAmount.value && amount.value) {
    originalAmount.value = amount.value
  }
})

watch(splitItems, (items) => {
  if (items.length === 0) {
    // если детей нет — возвращаем amount к originalAmount
    if (originalAmount.value) {
      amount.value = originalAmount.value
    }
    return
  }

  // считаем сумму всех amount в splitItems
  let totalChildAmount = 0
  for (const item of items) {
    const val = parseFloat(item.amount)
    if (!isNaN(val)) {
      totalChildAmount += val
    }
  }

  // Предполагаем, что родительская сумма - сумма детей
  // Если расход — amount отрицательный, иначе положительный (подстрой под свой кейс)
  // Здесь пример для расхода — отрицательное число
  amount.value = (originalAmount.value ? parseFloat(originalAmount.value) : 0) - totalChildAmount

  // При доходе — поменяй логику на сложение, если нужно
}, {deep: true})


walletStore.fetchWallets?.()
categoryStore.fetchCategories?.()

onMounted(() => {
  if (route.query.amount) {
    amount.value = route.query.amount
  }

  if (modalRef.value && modalRef.value.modalEl) { // modalEl из defineExpose
    modalInstance = new bootstrap.Modal(modalRef.value.modalEl)
  }

  selectedCurrency.value = settingsStore.settings.currency || 'BYN';
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
const newCategoryColor = ref('')

function openAddModal() {
  newCategoryName.value = ''
  newCategoryColor.value = ''

  if (modalInstance) {
    modalInstance.show()
  }
}

function addSplitItem() {
  // Проверяем, есть ли в splitItems элементы с пустыми обязательными полями
  const hasEmptyFields = splitItems.value.some(item =>
      !item.amount || !item.categoryId
  );

  if (hasEmptyFields) {
    alert('Пожалуйста, заполните все поля у существующих позиций перед добавлением новой.');
    return; // не добавляем новую позицию
  }

  splitItems.value.push({
    amount: '',
    categoryId: '',
    description: ''
  })
}

function removeSplitItem(index) {
  splitItems.value.splice(index, 1)
}

function onSplitClick() {
  if (splitItems.value.length === 0) {
    addSplitItem()
  }
}

async function onSaveCategory(category) {
  const created = await categoryStore.createCategory(
      category.name,
      isIncome.value ? TransactionTypes.INCOME : TransactionTypes.EXPENDITURE,
      category.color
  )

  if (created && created.id) {
    categoryId.value = created.id
    modalInstance.hide()
  }
}

// const handleSubmit = async () => {
//   if (!amount.value || !date.value) return;
//
//   let parsedDate = Array.isArray(date.value) ? date.value[0] : date.value;
//
//   if (!(parsedDate instanceof Date)) {
//     parsedDate = dayjs(date.value, 'DD.MM.YYYY').toDate();
//   }
//
//   const dateForSaving = parsedDate.toISOString();
//
//   try {
//     const amt = Number(amount.value);
//     const currency = selectedCurrency.value
//
//     if (isTransfer.value) {
//
//       if (!fromWalletId.value || !toWalletId.value || fromWalletId.value === toWalletId.value) {
//         alert('Выберите разные кошельки для перевода')
//         return;
//       }
//
//       await transactionStore.addTransaction({
//         amount: amt,
//         currency: currency,
//         date: dateForSaving,
//         description: description.value || 'Перевод',
//         type: TransactionTypes.TRANSFER,
//         user_id: userStore.id,
//         from_wallet_id: Number(fromWalletId.value),
//         to_wallet_id: Number(toWalletId.value),
//         category_id: null,
//         created_at: new Date().toISOString()
//       });
//
//       await walletStore.updateWalletBalance(Number(fromWalletId.value), -amt);
//       await walletStore.updateWalletBalance(Number(toWalletId.value), amt);
//     } else {
//       if (!walletId.value || !categoryId.value) {
//         alert('Выберите депозит и категорию')
//         return;
//       }
//
//       const delta = isIncome.value ? Number(amt) : -Number(amt)
//
//       await transactionStore.addTransaction({
//         amount: delta,
//         currency: currency,
//         date: dateForSaving, // ← ISO 8601 (UTC)
//         description: description.value,
//         type: isIncome.value ? TransactionTypes.INCOME : TransactionTypes.EXPENDITURE,
//         user_id: userStore.id,
//         wallet_id: Number(walletId.value),
//         category_id: Number(categoryId.value),
//         created_at: new Date().toISOString()
//       })
//
//       await walletStore.updateWalletBalance(Number(walletId.value), delta)
//     }
//
//     router.push('/analytics');
//   } catch (e) {
//     console.error('Ошибка при добавлении операции:', e)
//     alert('Не удалось сохранить операцию. Попробуйте снова.')
//   }
// }
const handleSubmit = async () => {
  if (!amount.value || !date.value) return;

  let parsedDate = Array.isArray(date.value) ? date.value[0] : date.value;

  if (!(parsedDate instanceof Date)) {
    parsedDate = dayjs(date.value, 'DD.MM.YYYY').toDate();
  }

  const dateForSaving = parsedDate.toISOString();

  try {
    const amt = Number(amount.value);
    const currency = selectedCurrency.value;

    if (isTransfer.value) {
      if (!fromWalletId.value || !toWalletId.value || fromWalletId.value === toWalletId.value) {
        alert('Выберите разные кошельки для перевода');
        return;
      }

      await transactionStore.addTransaction({
        amount: amt,
        currency,
        date: dateForSaving,
        description: description.value || 'Перевод',
        type: TransactionTypes.TRANSFER,
        user_id: userStore.id,
        from_wallet_id: Number(fromWalletId.value),
        to_wallet_id: Number(toWalletId.value),
        category_id: null,
        created_at: new Date().toISOString()
      });

      await walletStore.updateWalletBalance(Number(fromWalletId.value), -amt);
      await walletStore.updateWalletBalance(Number(toWalletId.value), amt);

    } else {
      if (!walletId.value) {
        alert('Выберите депозит');
        return;
      }

      if (splitItems.value.length > 0) {
        // Есть разбивка — сохраняем родительскую транзакцию с общей суммой
        const parentPayload = {
          amount: isIncome.value ? amt : -amt,
          currency,
          date: dateForSaving,
          description: description.value,
          type: isIncome.value ? TransactionTypes.INCOME : TransactionTypes.EXPENDITURE,
          user_id: userStore.id,
          wallet_id: Number(walletId.value),
          category_id: categoryId.value ? Number(categoryId.value) : null,
          created_at: new Date().toISOString()
        }

        // Добавляем дочерние
        parentPayload.children = splitItems.value.map(item => ({
          amount: isIncome.value ? Number(item.amount) : -Number(item.amount),
          currency,
          date: dateForSaving,
          description: item.description || '',
          type: isIncome.value ? TransactionTypes.INCOME : TransactionTypes.EXPENDITURE,
          user_id: userStore.id,
          wallet_id: Number(walletId.value),
          category_id: Number(item.categoryId),
          created_at: new Date().toISOString()
        }))

        await transactionStore.addTransaction(parentPayload);

        // Баланс кошелька обновляем на сумму родителя (которая равна сумме детей)
        const delta = isIncome.value ? Number(amt) : -Number(amt);
        await walletStore.updateWalletBalance(Number(walletId.value), delta);

      } else {
        // Обычное добавление без разбивки
        if (!categoryId.value) {
          alert('Выберите категорию');
          return;
        }

        const delta = isIncome.value ? Number(amt) : -Number(amt);

        await transactionStore.addTransaction({
          amount: delta,
          currency,
          date: dateForSaving,
          description: description.value,
          type: isIncome.value ? TransactionTypes.INCOME : TransactionTypes.EXPENDITURE,
          user_id: userStore.id,
          wallet_id: Number(walletId.value),
          category_id: Number(categoryId.value),
          created_at: new Date().toISOString()
        });

        await walletStore.updateWalletBalance(Number(walletId.value), delta);
      }
    }

    router.push('/analytics');

  } catch (e) {
    console.error('Ошибка при добавлении операции:', e);
    alert('Не удалось сохранить операцию. Попробуйте снова.');
  }
}
</script>

<template>
  <div class="text-center position-relative">
    <router-link to="/add-record" class="btn-close position-absolute" aria-label="Закрыть"/>

    <MainHeader :title="transactionTitle"/>

    <form @submit.prevent="handleSubmit" class="flex-grow-1 d-flex flex-column">
      <div class="mb-3">
        <label class="form-label">Сумма</label>
        <input v-model="amount" type="text" class="form-control" placeholder="Введите сумму"/>
      </div>

      <div class="mb-3">
        <label class="form-label">Валюта</label>
        <select v-model="selectedCurrency" class="form-select">
          <option v-for="currency in CurrenciesList" :key="currency.code" :value="currency.code">
            {{ currency.name }} ({{ currency.symbol }})
          </option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">Дата</label>
        <Flatpickr v-model="date" :config="config" class="form-control"/>
      </div>

      <!-- Депозиты -->
      <div v-if="!isTransfer" class="mb-3">
        <label class="form-label">Депозит</label>
        <select v-model="walletId" class="form-select">
          <option value="">Выберите депозит</option>
          <option :value="wallet.id" v-for="wallet in visibleWallets" :key="wallet.id">
            {{ wallet.name }}
          </option>
        </select>
      </div>

      <!-- Перевод: откуда и куда -->
      <div v-if="isTransfer" class="mb-3">
        <label class="form-label">С кошелька</label>
        <select v-model="fromWalletId" class="form-select mb-2">
          <option value="">Выберите источник</option>
          <option :value="wallet.id" v-for="wallet in visibleWallets" :key="'from-' + wallet.id">
            {{ wallet.name }}
          </option>
        </select>

        <label class="form-label">На кошелек</label>
        <select v-model="toWalletId" class="form-select">
          <option value="">Выберите получателя</option>
          <option :value="wallet.id" v-for="wallet in visibleWallets" :key="'to-' + wallet.id">
            {{ wallet.name }}
          </option>
        </select>
      </div>

      <!-- Категория только для НЕ Transfer -->
      <div v-if="!isTransfer" class="mb-3">
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
            <button type="button" class="btn btn-outline-success w-100" @click="openAddModal">
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- UI разбиения на категории -->
      <div class="mb-3" v-if="route.params.type === TransactionTypes.EXPENDITURE">
        <div v-for="(item, index) in splitItems" :key="index" class="border rounded p-1 mb-3">
          <div class="row">
            <div class="col-4">
              <input v-model="item.amount" type="text" class="form-control" placeholder="Сумма"/>
            </div>
            <div class="col-6">
              <select v-model="item.categoryId" class="form-select">
                <option value="">Выберите категорию</option>
                <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <div class="col-12 order-1 mt-2">
              <input v-model="item.description" type="text" class="form-control" placeholder="Комментарий"/>
            </div>
            <div class="col-2">
              <button type="button" class="w-100 btn btn-outline-danger" @click="removeSplitItem(index)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="btn btn-primary w-100 mt-auto" @click="addSplitItem">
          <span v-if="splitItems.length === 0">
            <i class="bi bi-scissors"></i> Разбить чек
          </span>
          <span v-else>
            <i class="bi bi-plus-lg me-1"></i> Добавить позицию
          </span>
        </button>
      </div>

      <div class="mb-3">
        <label class="form-label">Комментарий</label>
        <textarea v-model="description" class="form-control"/>
      </div>

      <button type="submit" class="btn btn-primary w-100 mt-auto">Сохранить</button>
    </form>

    <!-- Модальное окно -->
    <AddCategoryModal ref="modalRef" @save="onSaveCategory"/>

  </div>
</template>

<style scoped>
.row {
  --bs-gutter-x: 0.5rem;
}
</style>
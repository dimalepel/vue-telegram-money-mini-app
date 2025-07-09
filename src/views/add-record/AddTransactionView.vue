<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useWalletStore } from '@/stores/useWalletStore'
import { useUserStore } from '@/stores/useUserStore'
import { useCategoryStore } from '@/stores/useCategoryStore'

const amount = ref('')
const date = ref(new Date().toISOString().split('T')[0])
const description = ref('')
const walletId = ref('')
const categoryId = ref('')
const router = useRouter()
const route = useRoute()

const transactionStore = useTransactionStore()
const walletStore = useWalletStore()
const userStore = useUserStore()
const categoryStore = useCategoryStore()

const isIncome = ref(route.params.type === 'income')

walletStore.fetchWallets?.()
categoryStore.fetchCategories?.()

onMounted(() => {
  if (route.query.amount) {
    amount.value = route.query.amount
  }
})

// Отфильтрованные категории по типу
const filteredCategories = computed(() =>
    categoryStore.categories.filter(cat => cat.type === (isIncome.value ? 'income' : 'expenditure'))
)

const handleSubmit = async () => {
  if (!amount.value || !date.value || !walletId.value || !categoryId.value) return

  try {
    await transactionStore.addTransaction({
      amount: isIncome.value ? Number(amount.value) : -Number(amount.value),
      date: date.value,
      description: description.value,
      type: isIncome.value ? 'income' : 'expenditure',
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
    <h1 class="w-100 mb-3">{{ isIncome ? 'Доход' : 'Расход' }}</h1>
    <form @submit.prevent="handleSubmit" class="flex-grow-1 d-flex flex-column">
      <div class="mb-3">
        <label class="form-label">Сумма</label>
        <input v-model.number="amount" type="text" class="form-control" placeholder="Введите сумму" />
      </div>

      <div class="mb-3">
        <label class="form-label">Дата</label>
        <input v-model="date" type="date" class="form-control" />
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
        <select v-model="categoryId" class="form-select">
          <option value="">Выберите категорию</option>
          <option :value="cat.id" v-for="cat in filteredCategories" :key="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">Комментарий</label>
        <textarea v-model="description" class="form-control" />
      </div>

      <button type="submit" class="btn btn-primary w-100 mt-auto">Сохранить</button>
    </form>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@/stores/useWalletStore'
import { useWalletTypeStore } from '@/stores/useWalletTypeStore'
import { useUserStore } from '@/stores/useUserStore'

const walletStore = useWalletStore()
const walletTypeStore = useWalletTypeStore()
const userStore = useUserStore()
const router = useRouter()

const name = ref('')
const typeId = ref('')
const balance = ref(0)
const error = ref(null)

onMounted(() => {
  walletTypeStore.fetchWalletTypes()
})

const handleSubmit = async () => {
  error.value = null
  if (!name.value || !typeId.value || balance.value <= 0) {
    error.value = 'Пожалуйста, заполните все поля'
    return
  }

  try {
    await walletStore.addWallet({
      name: name.value,
      typeId: Number(typeId.value),
      balance: Number(balance.value),
      userId: userStore.id
    })
    router.push('/wallet')
  } catch {
    error.value = 'Ошибка при добавлении депозита'
  }
}
</script>

<template>
  <div class="text-center position-relative">
    <router-link to="/wallet" class="btn-close position-absolute" aria-label="Закрыть"></router-link>
    <h1 class="w-100 mb-3">Новый депозит</h1>
    <form @submit.prevent="handleSubmit" class="flex-grow-1 d-flex flex-column">
      <div class="mb-3">
        <label class="form-label">Название</label>
        <input v-model="name" type="text" class="form-control" placeholder="Введите заголовок"/>
      </div>

      <div class="mb-3">
        <label class="form-label">Тип депозита</label>
        <select v-model="typeId" class="form-select">
          <option value="">Выберите тип</option>
          <option :value="item.id" v-for="item in walletTypeStore.walletTypes" :key="item.id">{{ item.name }}</option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">Сумма депозита</label>
        <input v-model.number="balance" type="number" class="form-control" placeholder="Введите сумму"/>
      </div>

      <p v-if="error" class="text-danger mb-3">{{ error }}</p>

      <button type="submit" class="btn btn-primary w-100 mt-auto">Добавить</button>
    </form>
  </div>
</template>
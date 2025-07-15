<script setup>
import {ref, onMounted, watch} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWalletStore } from '@/stores/useWalletStore'
import { useWalletTypeStore } from '@/stores/useWalletTypeStore'
import { useUserStore } from '@/stores/useUserStore'
import MainHeader from "@/components/MainHeader.vue"

const walletStore = useWalletStore()
const walletTypeStore = useWalletTypeStore()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const isEditing = ref(false)
const walletId = ref(null)

const name = ref('')
const typeId = ref('')
const balance = ref('')
const error = ref(null)

onMounted(async () => {
  await walletTypeStore.fetchWalletTypes()
  await walletStore.fetchWallets()

  if (route.params.walletId) {
    isEditing.value = true
    walletId.value = Number(route.params.walletId)
    const existing = walletStore.wallets.find(w => w.id === walletId.value)
    if (existing) {
      name.value = existing.name
      typeId.value = Number(existing['wallet-type']?.id || 0)
      balance.value = existing.balance
    } else {
      error.value = 'Депозит не найден'
    }
  }
})

const handleSubmit = async () => {
  error.value = null
  if (!name.value || !typeId.value || balance.value < 0) {
    error.value = 'Пожалуйста, заполните все поля'
    return
  }

  try {
    if (isEditing.value) {
      await walletStore.editWallet(walletId.value, {
        name: name.value,
        typeId: Number(typeId.value),
        balance: Number(balance.value)
      })
    } else {
      await walletStore.addWallet({
        name: name.value,
        typeId: Number(typeId.value),
        balance: Number(balance.value),
        userId: userStore.id
      })
    }
    router.push('/wallet')
  } catch {
    error.value = isEditing.value
        ? 'Ошибка при редактировании депозита'
        : 'Ошибка при добавлении депозита'
  }
}

watch(balance, (newVal) => {
  let cleaned = String(newVal) // 👈 Явное преобразование
      .replace(',', '.')
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1')

  const match = cleaned.match(/^(\d+)(\.(\d{0,2})?)?/)
  balance.value = match ? match[1] + (match[2] || '') : ''
})
</script>

<template>
  <div class="text-center position-relative">
    <router-link to="/wallet" class="btn-close position-absolute" aria-label="Закрыть"></router-link>

    <MainHeader :title="isEditing ? 'Редактировать депозит' : 'Новый депозит'" />

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
        <input v-model="balance" type="text" class="form-control" placeholder="0"/>
      </div>

      <p v-if="error" class="text-danger mb-3">{{ error }}</p>

      <button type="submit" class="btn btn-primary w-100 mt-auto">
        {{ isEditing ? 'Сохранить изменения' : 'Добавить' }}
      </button>
    </form>
  </div>
</template>
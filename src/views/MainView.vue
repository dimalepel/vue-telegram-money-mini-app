<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/useUserStore.js'
import SvgLoader from "@/components/SvgLoader.vue"

const userStore = useUserStore()
const tgUserRaw = ref(null) // для отладки: исходные данные Telegram

onMounted(async () => {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user

  if (tgUser) {
    tgUserRaw.value = tgUser // сохранить для вывода на экран

    if (!userStore.isAuthenticated) {
      await userStore.findOrCreateUser(tgUser)
    }
  }
})
</script>

<template>
  <div class="align-items-center justify-content-center text-center">
    <SvgLoader class="mb-3" />

    <!-- ✅ Отладочная информация -->
    <div v-if="tgUserRaw" class="bg-light p-3 rounded text-start mx-3">
      <h6>Telegram User (debug):</h6>
      <pre>{{ tgUserRaw }}</pre>
    </div>
  </div>
</template>

<style scoped>
i {
  font-size: 5rem;
  color: #0d6efd;
}
pre {
  font-size: 0.75rem;
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
}
</style>
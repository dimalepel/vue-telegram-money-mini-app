<script setup>
import {onMounted, ref} from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import SvgLoader from "@/components/SvgLoader.vue";
import {useRouter} from "vue-router";
import AlertMessage from "@/components/AlertMessage.vue";

const userStore = useUserStore()
const router = useRouter()
const showFallbackNotice = ref(false)

onMounted( async () => {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
  console.log('tgUser из Telegram:', tgUser);

  if (tgUser) {
    await userStore.findOrCreateUser(tgUser)

    setTimeout(() => {
      router.push('/add-record')
    }, 2000)
  } else {
    // 1. Показываем уведомление
    showFallbackNotice.value = true

    // 2. Ждём 4 секунды, затем создаём тестового пользователя
    setTimeout(async () => {
      const testTgUser = {
        id: 123456789,
        first_name: "Dima",
        last_name: "Vashkevich",
        username: "dima_telegram",
        language_code: "ru",
        is_premium: true,
      };

      await userStore.findOrCreateUser(testTgUser)

      showFallbackNotice.value = false

      router.push('/add-record')
    }, 2000)
  }
})
</script>

<template>
  <div class="align-items-center justify-content-center text-center">
    <SvgLoader />
    <AlertMessage v-if="showFallbackNotice" message="Пользователь Telegram не найден, используется тестовый аккаунт." />
  </div>
</template>

<style scoped>
i {
  font-size: 5rem;
  color: #0d6efd;
}
.alert {
  position: absolute;
  bottom: 1.5rem;
  max-width: 90%;
  margin: 0 auto;
}
</style>
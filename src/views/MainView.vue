<script setup>
import { onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import SvgLoader from '@/components/SvgLoader.vue'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const showFallbackNotice = ref(false)

onMounted(() => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    tg.ready() // Сигнал Telegram, что приложение готово

    const tgUser = tg.initDataUnsafe?.user

    if (tgUser && !userStore.isAuthenticated) {
      userStore.findOrCreateUser(tgUser)
    } else {
      // Пользователь не найден — fallback
      showFallbackNotice.value = true

      setTimeout(async () => {
        await userStore.findOrCreateUser({
          id: 123456789,
          first_name: 'Dima',
          last_name: 'Vashkevich',
          username: 'dima_telegram',
          language_code: 'ru',
          is_premium: true
        })

        showFallbackNotice.value = false
        router.push('/add-record')
      }, 2000)
    }
  } else {
    // Telegram WebApp не загружен
    console.warn('Telegram WebApp не инициализирован')

    showFallbackNotice.value = true

    setTimeout(async () => {
      await userStore.findOrCreateUser({
        id: 123456789,
        first_name: 'Dima',
        last_name: 'Vashkevich',
        username: 'dima_telegram',
        language_code: 'ru',
        is_premium: true
      })

      showFallbackNotice.value = false
      router.push('/add-record')
    }, 2000)
  }
})
</script>

<template>
  <div class="align-items-center justify-content-center text-center">
    <SvgLoader class="mb-3" />
    <div v-if="showFallbackNotice" class="alert alert-warning fade show" role="alert">
      Пользователь Telegram не найден, используется тестовый аккаунт.
    </div>
  </div>
</template>

<style scoped>
.alert {
  position: absolute;
  bottom: 1.5rem;
  max-width: 90%;
  margin: 0 auto;
}
</style>
<script setup>
import {onMounted, ref} from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import SvgLoader from "@/components/SvgLoader.vue";
import {useRouter} from "vue-router";

const userStore = useUserStore()
const router = useRouter()
const showFallbackNotice = ref(false)

onMounted( async () => {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user

  if (!tgUser) {
    await userStore.findOrCreateUser(tgUser)

    setTimeout(() => {
      router.push('/add-record')
    }, 2000)
  } else {
    // 1. Показываем уведомление
    showFallbackNotice.value = true

    // 2. Ждём 4 секунды, затем создаём тестового пользователя
    setTimeout(async () => {
      await userStore.findOrCreateUser({
        id: 123456789,
        first_name: "Dima",
        last_name: "Vashkevich",
        username: "dima_telegram",
        language_code: "ru",
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

<!--<script setup>-->
<!--import { ref, onMounted } from 'vue'-->
<!--import { useUserStore } from '@/stores/useUserStore'-->

<!--const userId = ref(null)-->
<!--const userStore = useUserStore()-->

<!--onMounted(async () => {-->
<!--  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user-->

<!--  if (tgUser) {-->
<!--    userId.value = tgUser.id-->

<!--    await userStore.findOrCreateUser(tgUser)-->
<!--  }-->
<!--})-->
<!--</script>-->

<!--<template>-->
<!--  <div class="align-items-center justify-content-center text-center">-->
<!--    <h1>Привет, Telegram!</h1>-->
<!--    <p v-if="userId">Ваш Telegram ID: {{ userId }}</p>-->
<!--    <p v-else>Пользователь не определён</p>-->
<!--  </div>-->
<!--</template>-->
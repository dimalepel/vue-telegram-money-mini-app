<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/useUserStore.js'
import SvgLoader from "@/components/SvgLoader.vue";

const userStore = useUserStore()
const router = useRouter()

onMounted(async () => {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user

  if (tgUser && !userStore.isAuthenticated) {
    await userStore.findOrCreateUser(tgUser)
  }
})
</script>

<template>
  <div class="align-items-center justify-content-center">
    <SvgLoader class="mb-3"/>
  </div>
</template>

<style scoped>
i {
  font-size: 5rem;
  color: #0d6efd;
}
</style>
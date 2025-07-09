<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import SvgLoader from "@/components/SvgLoader.vue";

const userStore = useUserStore()

onMounted(async () => {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
  if (tgUser && !userStore.isAuthenticated) {
    await userStore.findOrCreateUser(tgUser)
  }
})
</script>

<template>
  <div class="align-items-center justify-content-center text-center">
    <SvgLoader class="mb-3" />
  </div>
</template>

<style scoped>
i {
  font-size: 5rem;
  color: #0d6efd;
}
</style>
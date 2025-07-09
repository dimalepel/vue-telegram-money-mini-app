<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/useUserStore.js'
import SvgLoader from "@/components/SvgLoader.vue";

const userStore = useUserStore()
const router = useRouter()

onMounted(() => {
  if (!userStore.isAuthenticated) {
    userStore.setUser({
      id: 1989,
      telegramId: 123,
      first_name: 'Dimitry',
      username: 'dimalepel1989',
    })
  }

  setTimeout(() => {
    router.push('/add-record')
  }, 2000);
})
</script>

<template>
  <div class="align-items-center justify-content-center">
    <SvgLoader/>
  </div>
</template>

<style scoped>
i {
  font-size: 5rem;
  color: #0d6efd;
}
</style>
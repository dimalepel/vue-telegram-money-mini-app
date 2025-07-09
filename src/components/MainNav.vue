<script setup>
import { useUserStore } from '@/stores/useUserStore'

const userStore = useUserStore()


</script>

<template>
  <nav class="d-flex justify-content-around py-2 container bg-white">
    <router-link class="btn btn-light" to="/add-record">
      <i class="bi bi-plus-circle"></i>
    </router-link>
    <router-link class="btn btn-light" to="/wallet">
      <i class="bi bi-wallet2"></i>
    </router-link>
    <router-link class="btn btn-light" to="/history">
      <i class="bi bi-clock-history"></i>
    </router-link>
    <router-link class="btn btn-light" to="/analytics">
      <i class="bi bi-graph-up"></i>
    </router-link>
    <router-link class="btn btn-light" to="/settings">
      <i class="bi bi-gear"></i>
    </router-link>
  </nav>
  <div class="text-center text-muted small mt-2" v-if="userStore.telegramId">
    Telegram ID: {{ userStore.telegramId }}
  </div>
</template>

<style scoped>
.router-link-active i {
  color: #0d6efd;
}
</style>
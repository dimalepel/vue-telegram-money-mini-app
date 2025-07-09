<script setup>
import { useRoute } from 'vue-router'
import MainNav from "./components/MainNav.vue"

const route = useRoute()
</script>

<template>
  <div class="pt-2 text-center">app version 1.2</div>
  <router-view class="d-flex flex-column flex-grow-1 container py-2 main-view"/>
  <MainNav v-if="!route.meta.hideNav" />
</template>

<style>
.main-view {
  height: calc(100vh - 54px);
  overflow-y: auto;
}
</style>

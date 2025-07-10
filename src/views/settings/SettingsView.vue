<script setup>
import MainHeader from "@/components/MainHeader.vue";

const appVersion = __APP_VERSION__
</script>

<template>
  <div>
    <MainHeader title="Настройки"/>

    <div class="btn-group-vertical">
      <router-link to="/categories/expenditure" class="btn category-detail btn-outline-secondary text-start d-flex align-items-center">
        Категории расходов <i class="bi bi-chevron-right ms-auto"></i>
      </router-link>
      <router-link to="/categories/income" class="btn category-detail btn-outline-secondary text-start d-flex align-items-center">
        Категории доходов <i class="bi bi-chevron-right ms-auto"></i>
      </router-link>
    </div>
    <div class="pt-2 mt-auto text-center">app version {{ appVersion }}</div>
  </div>
</template>

<style scoped>
.category-detail {
  --bs-btn-padding-y: 0.575rem;
}
</style>
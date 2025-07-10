<script setup>

import MainHeader from "@/components/MainHeader.vue";
</script>

<template>
  <div>
    <MainHeader title="Настройки"/>

    <div class="btn-group-vertical">
      <router-link to="/categories/expenditure" class="btn btn-outline-secondary text-start d-flex align-items-center">
        Категории расходов <i class="bi bi-chevron-right ms-auto"></i>
      </router-link>
      <router-link to="/categories/income" class="btn btn-outline-secondary text-start d-flex align-items-center">
        Категории доходов <i class="bi bi-chevron-right ms-auto"></i>
      </router-link>
    </div>
    <div class="pt-2 mt-auto text-center">app version 1.0.10</div>
  </div>
</template>

<style scoped>

</style>
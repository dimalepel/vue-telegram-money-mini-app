<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>

<template>
  <h1 class="w-100 mb-3 fs-3 text-center">{{ title }}</h1>
</template>

<style scoped>

</style>
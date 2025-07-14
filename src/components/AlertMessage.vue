<script setup>
const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'warning' // можно использовать: success, danger, info и т.д.
  }
})
</script>

<template>
  <div :class="`py-2 alert alert-${type}`" role="alert">
    {{ message }}
  </div>
</template>

<style scoped>

</style>
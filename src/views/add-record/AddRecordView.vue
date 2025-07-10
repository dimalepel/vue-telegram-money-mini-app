<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import MainHeader from "@/components/MainHeader.vue";

const amount = ref('')
const router = useRouter()

function goTo(type) {
  if (!amount.value || isNaN(Number(amount.value))) {
    alert('Введите число')
    return
  }

  router.push({
    name: 'AddTransaction',
    params: { type },
    query: { amount: amount.value }
  })
}
</script>

<template>
  <div class="text-center">
    <MainHeader title="Новая операция"/>
    <div class="d-flex flex-column justify-content-center flex-grow-1">
      <input v-model="amount" type="text" class="mb-3 display-1 fw-medium text-center border-0" placeholder="0" />
      <div class="row">
        <div class="col-6">
          <button @click="goTo('expenditure')" class="btn btn-danger mb-3 w-100">Расход</button>
        </div>
        <div class="col-6">
          <button @click="goTo('income')" class="btn btn-success w-100">Доход</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.display-1 {
  font-size: 5rem;
}
input:focus {
  outline: none;
}
</style>
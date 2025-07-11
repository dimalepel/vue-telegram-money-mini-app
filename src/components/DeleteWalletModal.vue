<script setup>
const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

function select(option) {
  emit('close', option)
}
</script>

<template>
  <div class="modal fade show d-block" tabindex="-1" role="dialog" v-if="show">
    <div class="modal-backdrop fade show"></div>

    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">

        <div class="modal-header">
          <h5 class="modal-title">Удалить депозит?</h5>
          <button type="button" class="btn-close" @click="select('cancel')" aria-label="Закрыть"></button>
        </div>

        <div class="modal-body">
          <p>Выберите, что именно вы хотите удалить:</p>
        </div>

        <div class="modal-footer flex-column gap-2">
          <button type="button" class="btn btn-danger w-100" @click="select('wallet')">
            Только депозит
          </button>
          <button type="button" class="btn btn-warning w-100" @click="select('walletAndTransactions')">
            Депозит и транзакции
          </button>
          <button type="button" class="btn btn-secondary w-100" @click="select('cancel')">
            Отмена
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-dialog-centered {
  z-index: 9999;
}
</style>


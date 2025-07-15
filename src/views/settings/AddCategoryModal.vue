<script setup>
import { ref, defineExpose, defineEmits } from 'vue'

const emits = defineEmits(['save', 'close'])

const modalEl = ref(null) // реф на DOM-элемент .modal
const newCategoryName = ref('')

function onSave() {
  if (!newCategoryName.value.trim()) return
  emits('save', newCategoryName.value.trim())
  newCategoryName.value = ''
}

function onClose() {
  newCategoryName.value = ''
  emits('close')
}

// expose modalEl, чтобы родитель мог получить DOM элемент
defineExpose({
  modalEl
})
</script>

<template>
  <div
      class="modal fade"
      id="addCategoryModal"
      tabindex="-1"
      aria-labelledby="addCategoryModalLabel"
      aria-hidden="true"
      ref="modalEl">
    <div class="modal-dialog">
      <div class="modal-content">
        <!-- содержимое -->
        <div class="modal-header">
          <h5 class="modal-title" id="addCategoryModalLabel">Новая категория</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть" @click="onClose"></button>
        </div>
        <div class="modal-body">
          <input
              v-model="newCategoryName"
              type="text"
              class="form-control"
              placeholder="Название категории"
              @keyup.enter="onSave"
          />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="onClose">Отмена</button>
          <button type="button" class="btn btn-primary" @click="onSave">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

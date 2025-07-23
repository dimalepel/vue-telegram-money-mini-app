<script setup>
import { ref, watch, defineExpose, defineEmits } from 'vue'
import { CategoryColors } from '@/constants/categoryColors'

const emits = defineEmits(['save', 'close'])

const modalEl = ref(null)
const newCategoryName = ref('')
const newCategoryColor = ref('')
const isEditMode = ref(false)
const editedCategoryId = ref(null)

function open(category = null) {
  if (category) {
    isEditMode.value = true
    editedCategoryId.value = category.id
    newCategoryName.value = category.name
    newCategoryColor.value = category.color
  } else {
    isEditMode.value = false
    editedCategoryId.value = null
    newCategoryName.value = ''
    newCategoryColor.value = ''
  }
}

function onSave() {
  if (!newCategoryName.value.trim() || !newCategoryColor.value) return;

  emits('save', {
    id: editedCategoryId.value,
    name: newCategoryName.value.trim(),
    color: newCategoryColor.value,
    isEditMode: isEditMode.value
  })

  newCategoryName.value = ''
  newCategoryColor.value = ''
  isEditMode.value = false
  editedCategoryId.value = null
}

function onClose() {
  newCategoryName.value = ''
  newCategoryColor.value = ''
  isEditMode.value = false
  editedCategoryId.value = null
  emits('close')
}

defineExpose({ modalEl, open })
</script>

<template>
  <div class="modal fade" id="addCategoryModal" tabindex="-1" aria-labelledby="addCategoryModalLabel" aria-hidden="true" ref="modalEl">
    <div class="modal-dialog">
      <div class="modal-content">
        <!-- содержимое -->
        <div class="modal-header">
          <h5 class="modal-title" id="addCategoryModalLabel">{{ isEditMode ? 'Редактировать категорию' : 'Новая категория' }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть" @click="onClose"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label text-center w-100">Название категории</label>
            <input v-model="newCategoryName" type="text" class="form-control"/>
          </div>

          <div class="mb-3">
            <label class="form-label text-center w-100">Выбрать цвет</label>
            <ul class="colors row">
              <li v-for="(color, index) in CategoryColors" class="colors__item col-2" :key="index">
                <input type="radio" class="btn-check" name="colors" :id="`color${index}`" :value="color" v-model="newCategoryColor">
                <label class="btn colors__button" :style="`background-color: ${color}`" :for="`color${index}`">&nbsp;</label>
              </li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="onClose">Отмена</button>
          <button type="button" class="btn btn-primary" @click="onSave">{{ isEditMode ? 'Обновить' : 'Сохранить' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.colors {
  --bs-gutter-x: 0.5rem;
  padding-left: 0;
  margin-top: 0;
  margin-bottom: 0;
  list-style: none;
}
.colors__item {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}
.colors__button {
  position: relative;
  display: block;
  padding: 0;
  width: 100%;
  border-radius: 100%;
  aspect-ratio: 1;
}
.btn-check:checked + .colors__button::before {
  content: "";
  position: absolute;
  display: block;
  border: 3px solid #ffffff;
  border-radius: 100%;
  width: 100%;
  height: 100%;
}
</style>
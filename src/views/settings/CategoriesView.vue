<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCategoryStore } from '@/stores/useCategoryStore'
import * as bootstrap from 'bootstrap'

const route = useRoute()
const categoryStore = useCategoryStore()

onMounted(() => {
  categoryStore.fetchCategories()
  modalInstance = new bootstrap.Modal(modalRef.value)
})

const type = computed(() => route.params.type)
const filteredCategories = computed(() => {
  return categoryStore.categories.filter(cat => cat.type === type.value)
})

function deleteCategory(id) {
  if (confirm('Удалить категорию?')) {
    categoryStore.deleteCategory(id)
  }
}

// ========== Модалка для добавления ==========
const modalRef = ref(null)
let modalInstance = null

const newCategoryName = ref('')

function openAddModal() {
  newCategoryName.value = ''
  modalInstance.show()
}

async function confirmAddCategory() {
  const name = newCategoryName.value.trim()
  if (!name) return

  await categoryStore.createCategory(name, type.value)
  modalInstance.hide()
}
</script>

<template>
  <div>
    <router-link to="/settings" class="btn-back position-absolute text-secondary" aria-label="Назад">
      <i class="bi bi-chevron-left"></i>
    </router-link>
    <h1 class="w-100 mb-3 text-center">Категории {{ type === 'income' ? 'доходов' : 'расходов' }}</h1>
    <div v-if="categoryStore.loading">Загрузка...</div>
    <div v-else-if="categoryStore.error" class="text-danger">{{ categoryStore.error }}</div>

    <ul v-else class="list-group">
      <li v-for="cat in filteredCategories" :key="cat.id" class="list-group-item d-flex align-items-center">
        {{ cat.name }}
        <button type="button" class="btn btn-outline-danger ms-auto" @click="deleteCategory(cat.id)">
          <i class="bi bi-trash"></i>
        </button>
      </li>
    </ul>

    <button class="btn btn-success mt-auto w-100" @click="openAddModal">
      <i class="bi bi-plus-lg me-1"></i> Добавить категорию
    </button>

    <!-- Модальное окно -->
    <div
        class="modal fade"
        id="addCategoryModal"
        tabindex="-1"
        aria-labelledby="addCategoryModalLabel"
        aria-hidden="true"
        ref="modalRef"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addCategoryModalLabel">Новая категория</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
          </div>
          <div class="modal-body">
            <input
                v-model="newCategoryName"
                type="text"
                class="form-control"
                placeholder="Название категории"
            />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="confirmAddCategory">
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-outline-danger {
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
}
.btn-back {
  font-size: 1.5rem;
  font-weight: 700;
}
.btn-outline-danger {
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
}
.btn-back {
  font-size: 1.5rem;
  font-weight: 700;
}
</style>
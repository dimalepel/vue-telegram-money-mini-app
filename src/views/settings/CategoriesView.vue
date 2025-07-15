<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCategoryStore } from '@/stores/useCategoryStore'
import * as bootstrap from 'bootstrap'
import AlertMessage from "@/components/AlertMessage.vue";
import MainHeader from "@/components/MainHeader.vue";
import AddCategoryModal from "@/views/settings/AddCategoryModal.vue";

const route = useRoute()
const categoryStore = useCategoryStore()

onMounted(() => {
  categoryStore.fetchCategories()
  if (modalRef.value && modalRef.value.modalEl) { // modalEl из defineExpose
    modalInstance = new bootstrap.Modal(modalRef.value.modalEl)
  }
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
  if (modalInstance) {
    modalInstance.show()
  }
}

async function onSaveCategory(name) {
  await categoryStore.createCategory(name, type.value)
  modalInstance.hide()
}
</script>

<template>
  <div>
    <router-link to="/settings" class="btn-back position-absolute text-secondary" aria-label="Назад">
      <i class="bi bi-chevron-left"></i>
    </router-link>
    <MainHeader :title="`Категории ${type === 'income' ? 'доходов' : 'расходов'}`" />

    <div v-if="categoryStore.loading">Загрузка...</div>
    <div v-else-if="categoryStore.error" class="text-danger">{{ categoryStore.error }}</div>

    <div v-else>
      <ul v-if="filteredCategories.length > 0" class="list-group">
        <li v-for="cat in filteredCategories" :key="cat.id" class="list-group-item d-flex align-items-center">
          {{ cat.name }}
          <button type="button" class="btn btn-outline-danger ms-auto" @click="deleteCategory(cat.id)">
            <i class="bi bi-trash"></i>
          </button>
        </li>
      </ul>
      <AlertMessage v-else message="У Вас нет доступных категорий" />
    </div>

    <button class="btn btn-success mt-auto w-100" @click="openAddModal">
      <i class="bi bi-plus-lg me-1"></i> Добавить категорию
    </button>

    <!-- Модальное окно -->
    <AddCategoryModal
        ref="modalRef"
        @save="onSaveCategory"
    />

  </div>
</template>

<style scoped>
.btn-outline-danger {
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
}

.btn-outline-danger {
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
}

</style>
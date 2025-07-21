<script setup>
import { ref, onMounted } from 'vue'
import { Modal } from 'bootstrap' // ✅ Правильный импорт!
import MainHeader from "@/components/MainHeader.vue"
import Flatpickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'

// Для версии приложения
const appVersion = __APP_VERSION__

// Логика переключателя
const remindersEnabled = ref(false)
const reminderTime = ref('17:30')

// Flatpickr конфиг для выбора только времени
const timeConfig = {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  time_24hr: true,
}

let timeModal // Переменная для экземпляра модалки

onMounted(() => {
  const modalElement = document.getElementById('timePickerModal')
  timeModal = new Modal(modalElement) // ✅ Используем импортированный класс, не window.bootstrap!
})

function openTimePicker() {
  timeModal.show()
}

function saveTime() {
  timeModal.hide()
  // Здесь можно вызывать API для сохранения времени
}
</script>

<template>
  <div>
    <MainHeader title="Настройки"/>

    <!-- Категории -->
    <div class="btn-group-vertical mb-2">
      <router-link
          to="/categories/expenditure"
          class="btn category-detail btn-outline-secondary text-start d-flex align-items-center"
      >
        Категории расходов <i class="bi bi-chevron-right ms-auto"></i>
      </router-link>

      <router-link
          to="/categories/income"
          class="btn category-detail btn-outline-secondary text-start d-flex align-items-center"
      >
        Категории доходов <i class="bi bi-chevron-right ms-auto"></i>
      </router-link>
    </div>

    <!-- Переключатель -->
    <div class="btn-group-vertical">
      <div class="btn btn-outline-secondary text-start d-flex align-items-center justify-content-between">
        Напоминания
        <div class="form-check form-switch">
          <input
              class="form-check-input"
              type="checkbox"
              v-model="remindersEnabled"
          />
        </div>
      </div>

      <!-- Кнопка для открытия модалки -->
      <div
          v-if="remindersEnabled"
          class="btn btn-outline-secondary text-start d-flex align-items-center"
          @click="openTimePicker"
      >
        Время напоминания
        <span class="ms-auto">{{ reminderTime }}</span>
        <i class="bi bi-chevron-right"></i>
      </div>
    </div>

    <!-- Модалка Bootstrap 5 -->
    <div
        class="modal fade"
        id="timePickerModal"
        tabindex="-1"
        aria-labelledby="timePickerModalLabel"
        aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="timePickerModalLabel">Выберите время</h5>
            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Закрыть"
            ></button>
          </div>
          <div class="modal-body">
            <Flatpickr
                v-model="reminderTime"
                :config="timeConfig"
                class="form-control"
            />
          </div>
          <div class="modal-footer">
            <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
            >
              Отмена
            </button>
            <button type="button" class="btn btn-primary" @click="saveTime">
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Версия -->
    <div class="pt-2 mt-auto text-center">
      app version {{ appVersion }}
    </div>
  </div>
</template>

<style scoped>
.category-detail {
  --bs-btn-padding-y: 0.575rem;
}
</style>

<script setup>
import {ref, onMounted, watch} from 'vue'
import { Modal } from 'bootstrap' // ✅ Правильный импорт!
import MainHeader from "@/components/MainHeader.vue"
import Flatpickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import debounce from 'lodash.debounce'
import {useUserStore} from "@/stores/useUserStore";
import AlertMessage from "@/components/AlertMessage.vue";

const userStore = useUserStore()
const appVersion = __APP_VERSION__
const remindersEnabled = ref(false)
const reminderTime = ref('17:30')
const showSavedMessage = ref(false)
const showArchivedData = ref(false)

const timeConfig = {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  time_24hr: true,
}

const initialSettings = ref({
  reminders_enabled: false,
  reminder_time: '17:30',
  show_archived_data: false
})

let timeModal

onMounted(() => {
  const modalElement = document.getElementById('timePickerModal')
  timeModal = new Modal(modalElement)

  const settings = userStore.settings || {}
  remindersEnabled.value = settings.reminders_enabled ?? false
  reminderTime.value = settings.reminder_time ?? '17:30'
  showArchivedData.value = settings.show_archived_data ?? false

  initialSettings.value = {
    reminders_enabled: remindersEnabled.value,
    reminder_time: reminderTime.value,
    show_archived_data: showArchivedData.value
  }
})

function openTimePicker() {
  timeModal.show()
}


function saveTime() {
  timeModal.hide()
  // Здесь можно вызывать API для сохранения времени
}

const debouncedSave = debounce(() => {
  const hasChanged =
      remindersEnabled.value !== initialSettings.value.reminders_enabled ||
      reminderTime.value !== initialSettings.value.reminder_time ||
      showArchivedData.value !== initialSettings.value.show_archived_data

  if (!hasChanged) return

  userStore.updateSettings({
    reminders_enabled: remindersEnabled.value,
    reminder_time: reminderTime.value,
    show_archived_data: showArchivedData.value
  }).then(() => {
    // Обновляем initialSettings после успешного сохранения
    initialSettings.value = {
      reminders_enabled: remindersEnabled.value,
      reminder_time: reminderTime.value,
      show_archived_data: showArchivedData.value
    }

    showSavedMessage.value = true
    setTimeout(() => {
      showSavedMessage.value = false
    }, 2000)
  })
}, 1000)

watch(
    [remindersEnabled, reminderTime, showArchivedData],
    debouncedSave
)
</script>

<template>
  <div class="position-relative">
    <MainHeader title="Настройки"/>

    <!-- Категории -->
    <div class="btn-group-vertical mb-2">
      <router-link to="/categories/expenditure" class="btn btn-setting btn-outline-secondary text-start d-flex align-items-center">
        Категории расходов <i class="bi bi-chevron-right ms-auto"></i>
      </router-link>

      <router-link to="/categories/income" class="btn btn-setting btn-outline-secondary text-start d-flex align-items-center">
        Категории доходов <i class="bi bi-chevron-right ms-auto"></i>
      </router-link>
    </div>

    <!-- Переключатель -->
    <div class="btn-group-vertical">
      <div class="btn btn-setting btn-outline-secondary text-start d-flex align-items-center justify-content-between">
        Напоминания
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" v-model="remindersEnabled" />
        </div>
      </div>

      <!-- Кнопка для открытия модалки -->
      <div v-if="remindersEnabled" class="btn btn-outline-secondary text-start d-flex align-items-center" @click="openTimePicker">
        Время напоминания
        <span class="ms-auto">{{ reminderTime }}</span>
        <i class="bi bi-chevron-right"></i>
      </div>

      <div class="btn btn-setting btn-outline-secondary text-start d-flex align-items-center justify-content-between">
        Показывать архивные данные
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" v-model="showArchivedData" />
        </div>
      </div>
    </div>

    <!-- Модалка Bootstrap 5 -->
    <div class="modal fade" id="timePickerModal" tabindex="-1" aria-labelledby="timePickerModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="timePickerModalLabel">Выберите время</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть" ></button>
          </div>
          <div class="modal-body">
            <Flatpickr v-model="reminderTime" :config="timeConfig" class="form-control" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
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

    <AlertMessage class="position-absolute mb-0" style="bottom: 0.5rem; right: calc(var(--bs-gutter-x) * .5); left: calc(var(--bs-gutter-x) * .5);" v-if="showSavedMessage" message="Настройки сохранены" type="success" />
  </div>
</template>

<style scoped>
.btn-setting {
  --bs-btn-padding-y: 0.575rem;
}

.form-check {
  margin-bottom: 0;
}
</style>

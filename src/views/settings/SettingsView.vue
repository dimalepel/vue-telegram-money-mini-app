<script setup>
import {ref, onMounted, watch, computed} from 'vue'
import { Modal } from 'bootstrap' // ✅ Правильный импорт!
import MainHeader from "@/components/MainHeader.vue"
import Flatpickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import debounce from 'lodash.debounce'
import {useUserStore} from "@/stores/useUserStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import AlertMessage from "@/components/AlertMessage.vue";
import { DateTime } from 'luxon'

function convertUtcToLocalTime(utcTime, timezone) {
  if (!utcTime) return ''
  const dtUtc = DateTime.fromFormat(utcTime, 'HH:mm', { zone: 'utc' })
  const dtLocal = dtUtc.setZone(timezone)
  return dtLocal.toFormat('HH:mm')
}

function convertLocalToUtc(localTime, timezone) {
  if (!localTime) return ''
  const dtLocal = DateTime.fromFormat(localTime, 'HH:mm', { zone: timezone })
  const dtUtc = dtLocal.setZone('utc')
  return dtUtc.toFormat('HH:mm')
}

const userStore = useUserStore()
const settingsStore = useSettingsStore()
const appVersion = __APP_VERSION__
const showSavedMessage = ref(false)

const remindersEnabled = computed({
  get: () => settingsStore.reminders_enabled,
  set: val => settingsStore.reminders_enabled = val
})

const reminderTime = computed({
  get() {
    return convertUtcToLocalTime(settingsStore.reminder_time, settingsStore.timezone || 'UTC')
  },
  set(val) {
    settingsStore.reminder_time = convertLocalToUtc(val, settingsStore.timezone || 'UTC')
  }
})


const showArchivedData = computed({
  get: () => settingsStore.show_archived_data,
  set: val => settingsStore.show_archived_data = val
})

const timeConfig = {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  time_24hr: true,
  minuteIncrement: 1,
}

const initialSettings = ref({
  reminders_enabled: false,
  reminder_time: '',
  show_archived_data: false
})

let timeModal

onMounted(async () => {
  const modalElement = document.getElementById('timePickerModal')
  timeModal = new Modal(modalElement)

  await settingsStore.loadSettings()

  initialSettings.value = {
    reminders_enabled: settingsStore.reminders_enabled,
    reminder_time: settingsStore.reminder_time,
    show_archived_data: settingsStore.show_archived_data
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
      settingsStore.reminders_enabled !== initialSettings.value.reminders_enabled ||
      settingsStore.reminder_time !== initialSettings.value.reminder_time ||
      settingsStore.show_archived_data !== initialSettings.value.show_archived_data

  if (!hasChanged) return

  settingsStore.updateSettings({
    reminders_enabled: settingsStore.reminders_enabled,
    reminder_time: settingsStore.reminder_time,
    show_archived_data: settingsStore.show_archived_data
  }).then(() => {
    initialSettings.value = {
      reminders_enabled: settingsStore.reminders_enabled,
      reminder_time: settingsStore.reminder_time,
      show_archived_data: settingsStore.show_archived_data
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

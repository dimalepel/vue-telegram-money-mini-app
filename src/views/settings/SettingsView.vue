<script setup>
import {ref, onMounted, watch, computed} from 'vue'
import { Modal } from 'bootstrap' // ✅ Правильный импорт!
import MainHeader from "@/components/MainHeader.vue"
import Flatpickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import debounce from 'lodash.debounce'
import { useSettingsStore } from "@/stores/useSettingsStore";
import AlertMessage from "@/components/AlertMessage.vue";
import { DateTime } from 'luxon'
import {storeToRefs} from "pinia";
import {CurrenciesList} from "@/constants/currenciesList"

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

const settingsStore = useSettingsStore()
const { error, currencies } = storeToRefs(settingsStore)

const appVersion = __APP_VERSION__
const showSavedMessage = ref(false)

const remindersEnabled = computed({
  get: () => settingsStore.settings.reminders_enabled,
  set: val => settingsStore.settings.reminders_enabled = val
})

const reminderTime = computed({
  get: () => convertUtcToLocalTime(settingsStore.settings.reminder_time, settingsStore.settings.timezone || 'UTC'),
  set: val => settingsStore.settings.reminder_time = convertLocalToUtc(val, settingsStore.settings.timezone || 'UTC')
})

const showArchivedData = computed({
  get: () => settingsStore.settings.show_archived_data,
  set: val => settingsStore.settings.show_archived_data = val
})

const selectedCurrency = computed({
  get: () => settingsStore.settings.currency,
  set: val => settingsStore.settings.currency = val
})

const currentCurrency = computed(() =>
    CurrenciesList.find(c => c.code === selectedCurrency.value)
)

const firstDayOfWeek = computed({
  get: () => settingsStore.settings.first_day_of_week ?? 1, // по умолчанию понедельник
  set: val => settingsStore.settings.first_day_of_week = val
})

const weekDays = {
  0: 'Воскресенье',
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота'
}

const initialSettings = ref({})

let timeModal, currencyModal, firstDayModal

const timeConfig = {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  time_24hr: true,
  minuteIncrement: 1,
}

// const initialSettings = ref({
//   reminders_enabled: false,
//   reminder_time: '',
//   show_archived_data: false,
//   currency: 'BYN'
// })

onMounted(async () => {
  timeModal = new Modal(document.getElementById('timePickerModal'))
  currencyModal = new Modal(document.getElementById('currencyPickerModal'))
  firstDayModal = new Modal(document.getElementById('firstDayPickerModal'))

  // const modalElement = document.getElementById('timePickerModal')
  // timeModal = new Modal(modalElement)

  // const currencyModalElement = document.getElementById('currencyPickerModal')
  // currencyModal = new Modal(currencyModalElement)

  await settingsStore.loadSettings()

  initialSettings.value = { ...settingsStore.settings }
})

// onMounted(() => {
//   const modalEl = document.getElementById('firstDayPickerModal')
//   firstDayModal = new Modal(modalEl)
// })

const openTimePicker = () => timeModal.show()
const saveTime = () => timeModal.hide()

const openCurrencyPicker = () => currencyModal.show()
const saveCurrency = () => currencyModal.hide()

const openFirstDayPicker = () => firstDayModal.show()

const saveFirstDay = () => firstDayModal.hide()

const debouncedSave = debounce(() => {
  const hasChanged =
      settingsStore.settings.reminders_enabled !== initialSettings.value.reminders_enabled ||
      settingsStore.settings.reminder_time !== initialSettings.value.reminder_time ||
      settingsStore.settings.show_archived_data !== initialSettings.value.show_archived_data ||
      settingsStore.settings.currency !== initialSettings.value.currency ||
      settingsStore.settings.first_day_of_week !== initialSettings.value.first_day_of_week

  if (!hasChanged) return

  settingsStore.updateSettings({ ...settingsStore.settings }).then(() => {
    initialSettings.value = { ...settingsStore.settings }
    showSavedMessage.value = true
    setTimeout(() => {
      showSavedMessage.value = false
    }, 2000)
  })
}, 1000)

watch(
    [remindersEnabled, reminderTime, showArchivedData, selectedCurrency, firstDayOfWeek],
    debouncedSave
)

watch(remindersEnabled, (newVal) => {
  if (newVal && !settingsStore.settings.reminder_time) {
    const timezone = settingsStore.settings.timezone || 'UTC'
    const now = DateTime.local().setZone(timezone)
    settingsStore.settings.reminder_time = now.set({ second: 0 }).toUTC().toFormat('HH:mm')
  }
})
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
    <ul class="list-group">
      <li class="list-group-item form-check form-switch btn-outline-secondary text-start d-flex align-items-center justify-content-between">
        <label class="form-check-label flex-grow-1 text-start" for="toggle-notification">Напоминания</label>
        <input class="form-check-input" type="checkbox" id="toggle-notification" v-model="remindersEnabled" />
      </li>

      <!-- Кнопка для открытия модалки -->
      <li v-if="remindersEnabled" class="list-group-item text-start d-flex align-items-center" @click="openTimePicker">
        Время напоминания
        <span class="ms-auto">{{ reminderTime }}</span>
        <i class="bi bi-chevron-right"></i>
      </li>

      <li class="form-check form-switch list-group-item btn-outline-secondary text-start d-flex align-items-center justify-content-between">
        <label class="form-check-label flex-grow-1 text-start" for="toggle-archived">Показывать архивные данные</label>
        <input class="form-check-input" type="checkbox" id="toggle-archived" v-model="showArchivedData" />
      </li>

      <li class="list-group-item text-start d-flex align-items-center" @click="openCurrencyPicker">
        Валюта по умолчанию
        <span class="ms-auto">
          {{ currentCurrency?.code }}
        </span>
        <i class="bi bi-chevron-right"></i>
      </li>

      <li class="list-group-item text-start d-flex align-items-center" @click="openFirstDayPicker">
        Первый день недели
        <span class="ms-auto">{{ weekDays[firstDayOfWeek] }}</span>
        <i class="bi bi-chevron-right"></i>
      </li>
    </ul>

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

    <!-- Модалка выбора дня недели -->
    <div class="modal fade" id="firstDayPickerModal" tabindex="-1" aria-labelledby="firstDayPickerModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="firstDayPickerModalLabel">Выберите первый день недели</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
          </div>
          <div class="modal-body">
            <div class="list-group">
              <button
                  v-for="(day, num) in weekDays"
                  :key="num"
                  class="list-group-item list-group-item-action"
                  :class="{ 'active': firstDayOfWeek === Number(num) }"
                  @click="firstDayOfWeek = Number(num)"
              >
                {{ day }}
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="saveFirstDay">Сохранить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка выбора валюты -->
    <div class="modal fade" id="currencyPickerModal" tabindex="-1" aria-labelledby="currencyPickerModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="currencyPickerModalLabel">Выберите валюту</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
          </div>
          <div class="modal-body">
            <div class="list-group">
              <button
                  v-for="currency in CurrenciesList"
                  :key="currency.code"
                  class="list-group-item list-group-item-action"
                  :class="{ 'active': selectedCurrency === currency.code }"
                  @click="selectedCurrency = currency.code"
              >
                {{ currency.code }} — {{ currency.name }} ({{ currency.symbol }})
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="saveCurrency">Сохранить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Версия -->
    <div class="pt-2 mt-auto text-center">
      app version {{ appVersion }}
    </div>

    <AlertMessage class="position-absolute mb-0" style="bottom: 0.5rem; right: calc(var(--bs-gutter-x) * .5); left: calc(var(--bs-gutter-x) * .5);" v-if="showSavedMessage" message="Настройки сохранены" type="success" />
    <AlertMessage class="position-absolute mb-0" style="bottom: 0.5rem; right: calc(var(--bs-gutter-x) * .5); left: calc(var(--bs-gutter-x) * .5);" v-if="error" :message="error" type="danger" />
  </div>
</template>

<style scoped>
.btn-setting,
.list-group-item {
  --bs-btn-padding-y: 0.575rem;
  --bs-btn-border-color: var(--bs-border-color);
  --bs-list-group-color: #6c757d;
}

.form-check {
  margin-bottom: 0;
}
</style>

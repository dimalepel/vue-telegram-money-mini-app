<script setup>
import { ref, onMounted } from 'vue'

const tg = window.Telegram?.WebApp || {}
const debugData = ref({})
const isReady = ref(false)

onMounted(() => {
  // Telegram WebApp может быть не готов — подождём init
  try {
    tg.ready?.()
    isReady.value = true

    debugData.value = {
      initData: tg.initData,
      initDataUnsafe: tg.initDataUnsafe,
      platform: tg.platform,
      version: tg.version,
      colorScheme: tg.colorScheme,
      isExpanded: tg.isExpanded,
      isVersionAtLeast: tg.isVersionAtLeast?.('6.0'),
      user: tg.initDataUnsafe?.user || null,
    }
  } catch (e) {
    console.error('Ошибка при инициализации WebApp:', e)
  }
})
</script>

<template>
  <div class="p-3">
    <h2>🛠 Telegram WebApp Debug</h2>

    <div v-if="!isReady" class="alert alert-warning">
      WebApp не инициализирован. Проверь, открыт ли Mini App в Telegram.
    </div>

    <div v-else>
      <pre class="bg-light p-3 rounded small">{{ debugData }}</pre>
    </div>
  </div>
</template>

<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
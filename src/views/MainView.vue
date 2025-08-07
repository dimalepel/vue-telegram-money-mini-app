<script setup>
import {onMounted, ref} from 'vue'
import {useUserStore} from '@/stores/useUserStore'
import {useSettingsStore} from "@/stores/useSettingsStore";
import SvgLoader from "@/components/SvgLoader.vue";
import {useRouter} from "vue-router";
import AlertMessage from "@/components/AlertMessage.vue";
import {testTgUser} from "@/constants/testTgUser";

const router = useRouter();
const showFallbackNotice = ref(false);

onMounted(async () => {
  const userStore = useUserStore();
  const settingsStore = useSettingsStore();

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  if (tgUser) {
    await userStore.findOrCreateUser(tgUser);
  } else {
    showFallbackNotice.value = true;

    await userStore.findOrCreateUser(testTgUser);
  }

  await settingsStore.loadSettings();

  setTimeout(() => {
    if (showFallbackNotice.value === true) showFallbackNotice.value = false;

    router.push('/add-record');
  }, 2000)
  
})
</script>

<template>
  <div class="align-items-center justify-content-center text-center">
    <SvgLoader/>
    <AlertMessage v-if="showFallbackNotice" message="Пользователь Telegram не найден, используется тестовый аккаунт."/>
  </div>
</template>

<style scoped>
i {
  font-size: 5rem;
  color: #0d6efd;
}

.alert {
  position: absolute;
  bottom: 1.5rem;
  max-width: 90%;
  margin: 0 auto;
}
</style>
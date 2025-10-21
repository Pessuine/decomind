<template>
  <div class="min-h-screen flex flex-col bg-slate-900 text-white">
    <header class="p-6 flex items-center justify-between">
      <button @click="goHome" class="text-sm text-slate-300">← 返回</button>
      <div v-if="session.currentTask?.progress" class="text-sm">
        {{ session.currentTask.progress.current }}/{{ session.currentTask.progress.total }}
      </div>
    </header>
    <main class="flex-1 flex flex-col items-center px-6 gap-6">
      <transition name="fade">
        <div v-if="session.lastStep" key="step" class="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl p-6 text-center">
          <p class="text-sm text-slate-500 mb-2">下一步</p>
          <p class="text-2xl font-semibold">{{ session.lastStep.text }}</p>
        </div>
      </transition>
      <p v-if="error" class="text-red-300">{{ error }}</p>
    </main>
    <footer class="bg-slate-800 rounded-t-3xl p-6 space-y-4">
      <button class="w-full h-14 bg-emerald-500 rounded-2xl text-xl font-semibold" @click="completeStep" :disabled="loading">
        ✅ 完成
      </button>
      <div class="grid grid-cols-2 gap-3">
        <button class="h-14 bg-slate-700 rounded-2xl" @click="toggleHelp" :disabled="loading || !session.menu.length">
          ❗ 遇到困难
        </button>
        <button class="h-14 bg-slate-700 rounded-2xl" @click="skip" :disabled="loading">
          🔄 换一步
        </button>
      </div>
      <transition name="slide">
        <div v-if="showHelp" class="grid grid-cols-2 gap-3">
          <button
            v-for="item in session.menu"
            :key="item.key"
            class="h-12 bg-slate-600 rounded-2xl text-sm"
            @click="help(item.key)"
          >
            {{ item.label }}
          </button>
        </div>
      </transition>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session';

const router = useRouter();
const session = useSessionStore();
const loading = ref(false);
const showHelp = ref(false);
const error = ref('');

async function completeStep() {
  error.value = '';
  showHelp.value = false;
  loading.value = true;
  try {
    await session.executeNext();
  } catch (err) {
    error.value = '加载失败，请重试';
  } finally {
    loading.value = false;
  }
}

async function help(type: string) {
  error.value = '';
  loading.value = true;
  try {
    await session.requestHelp(type);
  } catch (err) {
    error.value = '加载失败，请重试';
  } finally {
    loading.value = false;
    showHelp.value = false;
  }
}

async function skip() {
  error.value = '';
  loading.value = true;
  try {
    await session.skipStep();
  } catch (err) {
    error.value = '加载失败，请重试';
  } finally {
    loading.value = false;
    showHelp.value = false;
  }
}

function toggleHelp() {
  showHelp.value = !showHelp.value;
}

function goHome() {
  router.push({ name: 'home' });
}

onMounted(async () => {
  if (!session.currentTask) {
    router.replace({ name: 'home' });
    return;
  }
  if (!session.lastStep) {
    await completeStep();
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

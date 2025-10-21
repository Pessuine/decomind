<template>
  <div class="min-h-screen bg-slate-950 text-white flex flex-col">
    <header class="p-6 flex justify-between items-center">
      <button class="text-sm text-slate-300" @click="goHome">← 返回</button>
      <select v-model="depth" class="bg-slate-800 rounded-xl px-3 py-2 text-sm">
        <option value="light">轻量</option>
        <option value="normal">标准</option>
        <option value="deep">深入</option>
      </select>
    </header>
    <main class="flex-1 overflow-y-auto px-6 pb-32 space-y-4">
      <div v-for="(section, index) in session.outline" :key="index" class="bg-slate-900 rounded-3xl p-5 shadow-xl">
        <h2 class="text-lg font-semibold mb-3">{{ section.title }}</h2>
        <ul class="space-y-2">
          <li v-for="(step, idx) in section.steps" :key="idx" class="text-sm text-slate-300">• {{ step }}</li>
        </ul>
        <div v-if="section.children" class="pl-4 border-l border-slate-700 mt-3 space-y-3">
          <div v-for="(child, cidx) in section.children" :key="cidx">
            <h3 class="text-sm font-medium text-slate-200">{{ child.title }}</h3>
            <ul class="space-y-1">
              <li v-for="(step, sidx) in child.steps" :key="sidx" class="text-xs text-slate-400">- {{ step }}</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
    <footer class="fixed bottom-0 left-0 right-0 bg-slate-900 p-6 rounded-t-3xl">
      <button class="w-full h-14 bg-blue-500 rounded-2xl text-xl font-semibold" @click="beginAction" :disabled="loading">
        确认开始执行
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session';

const router = useRouter();
const route = useRoute();
const session = useSessionStore();
const loading = ref(false);
const depth = ref<'light' | 'normal' | 'deep'>('normal');

async function fetchGuide() {
  const topic = (route.query.topic as string) || session.currentTask?.title || '';
  if (!topic) {
    router.replace({ name: 'home' });
    return;
  }
  loading.value = true;
  try {
    await session.requestGuide(topic, depth.value);
  } catch (err) {
    // ignore
  } finally {
    loading.value = false;
  }
}

function beginAction() {
  const topic = (route.query.topic as string) || session.currentTask?.title;
  if (!topic) return;
  session.reset();
  session.setTask(topic);
  router.push({ name: 'action' });
}

function goHome() {
  router.push({ name: 'home' });
}

onMounted(fetchGuide);
watch(depth, fetchGuide);
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-900 text-white">
    <header class="px-6 pt-10 pb-4">
      <button class="text-sm text-slate-400" @click="back">← 返回</button>
      <p class="mt-3 text-xs uppercase tracking-widest text-slate-500">进度</p>
      <div class="mt-2 flex items-center gap-2 text-sm text-slate-300">
        <span>{{ progress.current }}</span>
        <div class="flex-1 h-2 rounded-full bg-slate-800">
          <div class="h-2 rounded-full bg-indigo-500 transition-all" :style="{ width: percent }"></div>
        </div>
        <span>{{ progress.total }}</span>
      </div>
    </header>

    <main class="flex-1 flex flex-col items-center px-6">
      <div class="mt-10 w-full max-w-md bg-slate-800/80 rounded-3xl shadow-xl p-8 text-center transition">
        <p class="text-sm text-indigo-300 mb-4 tracking-wide">下一步动作</p>
        <h2 class="text-2xl font-semibold leading-relaxed">{{ step?.step.text || '准备开始' }}</h2>
      </div>
      <div v-if="error" class="mt-4 text-sm text-rose-300">{{ error }}</div>
      <div v-if="step?.menu?.length" class="mt-8 grid grid-cols-2 gap-3 w-full max-w-md">
        <button
          v-for="item in step.menu"
          :key="item.key"
          class="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 bg-slate-900/40 hover:border-indigo-400"
          @click="onHelp(item.key)"
        >{{ item.label }}</button>
      </div>
    </main>

    <nav class="sticky bottom-0 bg-slate-950/80 backdrop-blur border-t border-slate-800 px-6 py-4 flex items-center gap-4">
      <button
        class="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-semibold shadow-lg"
        :disabled="loading"
        @click="complete"
      >✅ 完成</button>
      <button
        class="w-14 h-14 rounded-full bg-amber-500 text-white text-xl shadow-lg"
        :disabled="loading"
        @click="onHelp('hint')"
      >❗</button>
      <button
        class="w-14 h-14 rounded-full bg-slate-700 text-white text-xl"
        :disabled="loading"
        @click="skip"
      >🔄</button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/session';

const router = useRouter();
const route = useRoute();
const session = useSessionStore();

const step = computed(() => session.step);
const loading = computed(() => session.loading);
const error = computed(() => session.error);
const progress = computed(() => session.progress);
const percent = computed(() => {
  if (!progress.value.total) return '0%';
  return `${Math.min(100, Math.round((progress.value.current / progress.value.total) * 100))}%`;
});

const back = () => {
  router.replace('/');
};

const complete = async () => {
  const title = route.query.title as string;
  if (!title) return;
  await session.completeCurrent(title);
};

const onHelp = async (key: string) => {
  if (!session.step) return;
  await session.help(key, { current: session.step.step.text, task: route.query.title as string });
};

const skip = async () => {
  if (!session.step) return;
  await session.skip({ current: session.step.step.text, task: route.query.title as string });
};
</script>

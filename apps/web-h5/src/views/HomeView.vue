<template>
  <div class="min-h-screen flex flex-col px-6 py-10 bg-slate-900 text-white">
    <header class="mb-12">
      <h1 class="text-3xl font-semibold tracking-tight">分解力</h1>
      <p class="text-slate-400 mt-2">把复杂任务拆成可执行的小步。</p>
    </header>

    <section class="flex-1 flex flex-col gap-6">
      <div class="bg-slate-800/70 rounded-3xl p-6 shadow-lg space-y-4">
        <label class="block text-sm uppercase tracking-widest text-slate-400">任务</label>
        <textarea
          v-model="taskTitle"
          class="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          rows="3"
          placeholder="今天想做什么？例如：整理工作台"
        ></textarea>
        <div class="flex items-center justify-between bg-slate-900/40 rounded-2xl px-3 py-2">
          <button
            class="flex-1 py-3 rounded-2xl text-sm font-medium transition"
            :class="mode === 'action' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400'"
            @click="mode = 'action'"
          >⚡ 做起来</button>
          <button
            class="flex-1 py-3 rounded-2xl text-sm font-medium transition"
            :class="mode === 'guide' ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-400'"
            @click="mode = 'guide'"
          >🎓 怎么做</button>
        </div>
        <div class="flex items-center justify-between text-sm text-slate-400">
          <span>改进体验（保存样本）</span>
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <span class="text-xs">{{ session.consentImprove ? '开启' : '关闭' }}</span>
            <input type="checkbox" v-model="session.consentImprove" class="accent-indigo-500" />
          </label>
        </div>
      </div>

      <button
        class="w-full py-4 rounded-full text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-900/40"
        :disabled="!taskTitle.trim() || session.loading"
        @click="start"
      >
        {{ mode === 'action' ? '立即分解任务' : '生成任务大纲' }}
      </button>
    </section>

    <footer class="mt-12 text-xs text-slate-500">
      <p>所有 AI 响应均为结构化 JSON，遇到失败会直接提示。</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session';

const taskTitle = ref('');
const mode = ref<'action' | 'guide'>('action');
const session = useSessionStore();
const router = useRouter();

const start = async () => {
  if (!taskTitle.value.trim()) return;
  if (mode.value === 'action') {
    await session.execute({ title: taskTitle.value.trim(), history: [] });
    router.push({ name: 'action', query: { title: taskTitle.value.trim() } });
  } else {
    await session.guide(taskTitle.value.trim(), 'normal');
    router.push({ name: 'guide' });
  }
};
</script>

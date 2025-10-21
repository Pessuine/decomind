<template>
  <div class="min-h-screen flex flex-col justify-between px-6 py-8 bg-gradient-to-b from-blue-50 to-white">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold text-slate-800">分解力</h1>
      <p class="text-slate-500">把困难的任务拆成一步步行动，随时求助。</p>
    </header>
    <main class="space-y-6">
      <div class="bg-white rounded-3xl shadow-xl p-6 space-y-4">
        <label class="text-sm text-slate-500">当前任务</label>
        <textarea
          v-model="task"
          rows="3"
          class="w-full rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:outline-none p-4 text-lg"
          placeholder="例如：洗澡、整理房间、写实验报告..."
        ></textarea>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" v-model="consent" class="w-4 h-4" />
          允许匿名记录本次对话用于体验改进
        </label>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <button @click="startAction" class="h-32 rounded-3xl bg-blue-500 text-white font-semibold text-xl shadow-lg">
          ⚡ 做起来
        </button>
        <button @click="startGuide" class="h-32 rounded-3xl bg-emerald-500 text-white font-semibold text-xl shadow-lg">
          🎓 怎么做
        </button>
      </div>
    </main>
    <footer class="text-center text-xs text-slate-400">打开时才会记录样本，重视你的隐私</footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session';

const router = useRouter();
const session = useSessionStore();
const task = ref(session.currentTask?.title || '');
const consent = ref(session.consentImprove);

async function startAction() {
  if (!task.value.trim()) return;
  session.reset();
  await session.setConsent(consent.value);
  session.setTask(task.value.trim());
  router.push({ name: 'action' });
}

async function startGuide() {
  if (!task.value.trim()) return;
  session.reset();
  await session.setConsent(consent.value);
  router.push({ name: 'guide', query: { topic: task.value.trim() } });
}
</script>

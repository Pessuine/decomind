<template>
  <div class="min-h-screen flex flex-col">
    <header class="px-6 py-4">
      <h1 class="text-2xl font-semibold">分解力</h1>
      <p class="text-sm text-slate-300 mt-1">把复杂任务拆解成下一步行动</p>
    </header>
    <main class="flex-1 px-6 py-4 space-y-6">
      <section class="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl shadow-slate-900/40">
        <h2 class="text-lg font-semibold mb-3">立即开始</h2>
        <label class="block text-sm text-slate-300 mb-2" for="task-title">你的目标</label>
        <textarea
          id="task-title"
          v-model="taskTitle"
          placeholder="例：完成无菌检查实验报告"
          class="w-full rounded-2xl bg-slate-950/80 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          rows="3"
        ></textarea>
        <div class="grid grid-cols-2 gap-3 mt-4">
          <button class="rounded-2xl bg-emerald-500 text-slate-950 font-semibold py-3" @click="startAction">⚡ 做起来</button>
          <button class="rounded-2xl bg-slate-800 text-slate-200 font-semibold py-3" @click="startGuide">🎓 怎么做</button>
        </div>
      </section>
      <section class="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
        <h3 class="text-base font-semibold mb-2">运行原则</h3>
        <ul class="text-sm space-y-2 text-slate-300">
          <li>所有 AI 响应均为 JSON，失败直接提示错误。</li>
          <li>每一次调用都会留存安全日志，保护你的数据。</li>
          <li>只有在你授权体验改进时，才会收集匿名样本。</li>
        </ul>
      </section>
    </main>
    <footer class="px-6 py-4 text-xs text-slate-500">© {{ year }} 分解力 · 专注安全可控的行动指导</footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const taskTitle = ref("");
const year = new Date().getFullYear();

function startAction() {
  console.info("start action", taskTitle.value);
}

function startGuide() {
  console.info("start guide", taskTitle.value);
}
</script>

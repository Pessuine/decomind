<template>
  <div class="px-6 py-12 max-w-xl mx-auto">
    <h1 class="text-3xl font-semibold text-center mb-6">今天想做什么？</h1>
    <div class="bg-slate-800/70 rounded-3xl p-6 shadow-xl">
      <label class="block text-sm text-slate-300 mb-2">任务名称</label>
      <input
        v-model="task"
        type="text"
        placeholder="例如：整理书桌"
        class="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
      <div class="mt-6 flex items-center justify-between bg-slate-900/60 rounded-2xl p-2">
        <button
          class="flex-1 py-2 rounded-2xl"
          :class="mode === 'action' ? 'bg-emerald-500 text-black font-semibold shadow-lg' : 'text-slate-300'"
          @click="mode = 'action'"
        >
          ⚡ 做起来
        </button>
        <button
          class="flex-1 py-2 rounded-2xl"
          :class="mode === 'guide' ? 'bg-indigo-500 text-white font-semibold shadow-lg' : 'text-slate-300'"
          @click="mode = 'guide'"
        >
          🎓 怎么做
        </button>
      </div>
      <div class="mt-4 flex items-center gap-2">
        <input id="consent" type="checkbox" v-model="consent" class="accent-emerald-400" />
        <label for="consent" class="text-xs text-slate-400">允许匿名采样改进体验</label>
      </div>
      <button
        class="w-full mt-6 py-3 rounded-2xl bg-emerald-400 text-black font-semibold shadow-lg disabled:bg-slate-700 disabled:text-slate-400 transition"
        :disabled="!task"
        @click="start"
      >
        开始
      </button>
      <p v-if="error" class="text-xs text-rose-300 mt-3">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/session";

const router = useRouter();
const store = useSessionStore();
const task = ref("");
const mode = ref<"action" | "guide">("action");
const consent = ref(false);
const error = ref("");

const start = async () => {
  error.value = "";
  try {
    await store.setConsent(consent.value);
    if (mode.value === "action") {
      await store.startAction(task.value.trim());
      router.push({ name: "execute" });
    } else {
      const outline = await store.guide(task.value.trim(), "normal");
      router.push({ name: "execute", query: { outline: JSON.stringify(outline), topic: task.value.trim() } });
    }
  } catch (err: any) {
    error.value = err.message || "加载失败，请重试";
  }
};
</script>

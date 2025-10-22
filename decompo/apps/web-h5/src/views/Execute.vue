<template>
  <div class="min-h-screen flex flex-col">
    <header class="px-6 pt-8 pb-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-slate-400">当前任务</p>
          <h2 class="text-xl font-semibold">{{ store.currentTask }}</h2>
        </div>
        <div v-if="store.progress" class="text-right">
          <p class="text-xs text-slate-400">进度</p>
          <p class="text-sm font-semibold">{{ store.progress.current }} / {{ store.progress.total }}</p>
        </div>
      </div>
      <div class="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-emerald-400 transition-all"
          :style="{ width: `${store.progress?.percent ?? 0}%` }"
        ></div>
      </div>
    </header>

    <main class="flex-1 px-6">
      <div class="bg-slate-800/70 rounded-3xl p-8 text-center shadow-2xl mt-6">
        <p class="text-sm uppercase tracking-wide text-emerald-300">下一步</p>
        <p class="text-2xl font-semibold mt-3 leading-snug">{{ store.step?.text || "准备中..." }}</p>
        <p v-if="flash" class="text-xs text-slate-400 mt-4">{{ flash }}</p>
      </div>

      <div v-if="outline" class="mt-8 space-y-4">
        <h3 class="text-sm text-slate-400">大纲预览</h3>
        <div class="space-y-3">
          <div
            v-for="node in outline"
            :key="node.title"
            class="bg-slate-900/50 border border-slate-800 rounded-2xl p-4"
          >
            <h4 class="font-semibold text-slate-100">{{ node.title }}</h4>
            <ul v-if="node.steps" class="mt-2 space-y-1 text-sm text-slate-300 text-left">
              <li v-for="step in node.steps" :key="step">• {{ step }}</li>
            </ul>
          </div>
        </div>
      </div>
    </main>

    <footer class="sticky bottom-0 px-6 pb-8 pt-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
      <div class="flex gap-3">
        <button
          class="flex-1 py-4 rounded-2xl bg-emerald-400 text-black font-semibold shadow-lg disabled:bg-slate-700"
          :disabled="loading"
          @click="completeStep"
        >
          ✅ 完成
        </button>
        <div class="relative flex-1">
          <button
            class="w-full py-4 rounded-2xl bg-amber-400 text-black font-semibold shadow-lg"
            :disabled="loading"
            @click="toggleHelp"
          >
            ❗ 遇到困难
          </button>
          <transition name="fade">
            <div
              v-if="showHelp"
              class="absolute left-0 right-0 bottom-full mb-3 bg-slate-900/95 border border-slate-700 rounded-2xl p-3 space-y-2"
            >
              <button
                v-for="item in store.menu || defaultMenu"
                :key="item.key"
                class="w-full py-2 rounded-xl bg-slate-800 text-slate-100 text-sm"
                @click="askHelp(item.key as any)"
              >
                {{ item.label }}
              </button>
            </div>
          </transition>
        </div>
        <button
          class="flex-1 py-4 rounded-2xl bg-indigo-500 text-white font-semibold shadow-lg disabled:bg-slate-700"
          :disabled="loading"
          @click="skipStep"
        >
          🔄 换一步
        </button>
      </div>
      <p v-if="error" class="text-xs text-rose-300 mt-3 text-center">{{ error }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useSessionStore } from "@/stores/session";

const store = useSessionStore();
const route = useRoute();
const loading = ref(false);
const showHelp = ref(false);
const error = ref("");
const flash = ref("");

const outline = computed(() => {
  const raw = route.query.outline as string | undefined;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return undefined;
  }
});

const defaultMenu = [
  { key: "simpler", label: "更简单一点" },
  { key: "alt", label: "换个做法" },
  { key: "hint", label: "给个快速提示" },
  { key: "split", label: "分更小一步" },
];

const withGuard = async (fn: () => Promise<void>) => {
  loading.value = true;
  error.value = "";
  try {
    await fn();
    flash.value = `已完成 ${store.progress?.current ?? 0}/${store.progress?.total ?? 0}`;
    setTimeout(() => (flash.value = ""), 1500);
  } catch (err: any) {
    error.value = err.message || "加载失败，请重试";
  } finally {
    loading.value = false;
  }
};

const completeStep = () => withGuard(() => store.nextStep());
const skipStep = () => withGuard(() => store.skip());
const askHelp = (key: "simpler" | "alt" | "hint" | "split") => {
  showHelp.value = false;
  return withGuard(() => store.help(key));
};
const toggleHelp = () => {
  showHelp.value = !showHelp.value;
};

onMounted(() => {
  if (!store.currentTask) {
    window.location.href = "/";
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

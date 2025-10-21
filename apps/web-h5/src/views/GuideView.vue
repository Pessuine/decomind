<template>
  <div class="min-h-screen bg-slate-900 text-white px-6 py-8">
    <header class="flex items-center justify-between mb-8">
      <button class="text-sm text-slate-400" @click="back">← 返回</button>
      <h1 class="text-lg font-semibold">任务大纲</h1>
      <div class="w-8"></div>
    </header>

    <section class="space-y-4">
      <article v-for="(item, idx) in outline" :key="idx" class="bg-slate-800/70 rounded-3xl p-6 shadow-md">
        <h2 class="text-xl font-semibold mb-3">{{ item.title }}</h2>
        <ul class="space-y-2 text-sm text-slate-300" v-if="item.steps?.length">
          <li v-for="(step, sIdx) in item.steps" :key="sIdx" class="flex items-start gap-2">
            <span class="mt-1 text-indigo-400">•</span>
            <span>{{ step }}</span>
          </li>
        </ul>
        <div v-if="item.children" class="mt-4 ml-4 space-y-2">
          <article v-for="(child, cIdx) in item.children" :key="cIdx" class="bg-slate-900/60 rounded-2xl p-4">
            <h3 class="font-medium mb-2">{{ child.title }}</h3>
            <ul class="space-y-1 text-sm text-slate-300" v-if="child.steps">
              <li v-for="(step, sIdx) in child.steps" :key="sIdx">{{ step }}</li>
            </ul>
          </article>
        </div>
      </article>
    </section>

    <button
      class="mt-10 w-full py-4 rounded-full bg-indigo-500 text-white font-semibold"
      @click="startAction"
    >确认开始</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session';

const session = useSessionStore();
const router = useRouter();
const outline = computed(() => session.outline);

const back = () => router.replace('/');

const startAction = async () => {
  if (!session.topic) return;
  await session.execute({ title: session.topic, history: [] });
  router.push({ name: 'action', query: { title: session.topic } });
};
</script>

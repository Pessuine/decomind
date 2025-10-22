<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Prompt 管理</h1>
      <button class="px-4 py-2 rounded-xl bg-emerald-500 text-black" @click="save">保存当前</button>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="prompt in prompts"
        :key="prompt.name"
        class="bg-slate-900/70 rounded-2xl p-4 space-y-3 border border-slate-800"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold">{{ prompt.name }}</p>
            <p class="text-xs text-slate-400">版本 {{ prompt.version }}</p>
          </div>
          <label class="text-xs text-slate-300">
            <input type="checkbox" v-model="prompt.enabled" class="mr-1" />启用
          </label>
        </div>
        <textarea
          v-model="prompt.content"
          rows="8"
          class="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs"
        ></textarea>
      </div>
    </div>
    <p v-if="message" class="text-sm text-emerald-400">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import api from "@/api/client";

const prompts = reactive<any[]>([]);
const message = ref("");

const load = async () => {
  const res = await api.get("/v1/admin/prompts");
  prompts.splice(0, prompts.length, ...res.data.data.map((p: any) => ({ ...p })));
};

const save = async () => {
  for (const prompt of prompts) {
    await api.post("/v1/admin/prompts", {
      name: prompt.name,
      content: prompt.content,
      enabled: prompt.enabled,
    });
  }
  message.value = "已保存";
  setTimeout(() => (message.value = ""), 1500);
  await load();
};

onMounted(load);
</script>

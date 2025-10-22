<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold">模型配置</h1>
    <form class="bg-slate-900/70 rounded-2xl p-6 space-y-4" @submit.prevent="save">
      <div>
        <label class="text-xs text-slate-400">Base URL</label>
        <input v-model="form.apiBase" class="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700" />
      </div>
      <div>
        <label class="text-xs text-slate-400">Model Name</label>
        <input v-model="form.modelName" class="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700" />
      </div>
      <div>
        <label class="text-xs text-slate-400">API Key</label>
        <input v-model="form.apiKey" class="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="text-xs text-slate-400">Temperature</label>
          <input type="number" step="0.1" v-model.number="form.temperature" class="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700" />
        </div>
        <div>
          <label class="text-xs text-slate-400">Max Tokens</label>
          <input type="number" v-model.number="form.maxTokens" class="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700" />
        </div>
      </div>
      <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-500 text-black">保存</button>
      <p v-if="message" class="text-sm text-emerald-400">{{ message }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import api from "@/api/client";

const form = reactive({ apiBase: "", modelName: "", apiKey: "", temperature: 0.6, maxTokens: 256 });
const message = ref("");

const load = async () => {
  const res = await api.get("/v1/admin/model");
  Object.assign(form, res.data.data || {});
  form.apiKey = "";
};

const save = async () => {
  await api.post("/v1/admin/model", form);
  message.value = "已更新";
  setTimeout(() => (message.value = ""), 1500);
};

onMounted(load);
</script>

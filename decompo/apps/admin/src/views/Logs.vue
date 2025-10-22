<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-3 items-end">
      <div>
        <label class="text-xs text-slate-400">Endpoint</label>
        <input v-model="filters.endpoint" class="mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" />
      </div>
      <div>
        <label class="text-xs text-slate-400">Mode</label>
        <input v-model="filters.mode" class="mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" />
      </div>
      <div>
        <label class="text-xs text-slate-400">Status</label>
        <input v-model="filters.status" class="mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" />
      </div>
      <button class="px-4 py-2 rounded-xl bg-emerald-500 text-black" @click="load">筛选</button>
    </div>
    <div class="bg-slate-900/70 rounded-2xl overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-900 text-slate-300">
          <tr>
            <th class="text-left px-4 py-3">ID</th>
            <th class="text-left px-4 py-3">时间</th>
            <th class="text-left px-4 py-3">Endpoint</th>
            <th class="text-left px-4 py-3">Mode</th>
            <th class="text-left px-4 py-3">状态</th>
            <th class="text-left px-4 py-3">延迟</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-t border-slate-800">
            <td class="px-4 py-3">{{ row.id }}</td>
            <td class="px-4 py-3">{{ row.ts }}</td>
            <td class="px-4 py-3">{{ row.endpoint }}</td>
            <td class="px-4 py-3">{{ row.mode }}</td>
            <td class="px-4 py-3">{{ row.status }}</td>
            <td class="px-4 py-3">{{ row.latency_ms }} ms</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import api from "@/api/client";

const filters = reactive({ endpoint: "", mode: "", status: "" });
const rows = ref<any[]>([]);

const load = async () => {
  const res = await api.get("/v1/admin/logs", { params: filters });
  rows.value = res.data.data;
};

onMounted(load);
</script>

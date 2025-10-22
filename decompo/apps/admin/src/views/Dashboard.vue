<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">仪表盘</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-slate-900/70 rounded-2xl p-4">
        <p class="text-xs text-slate-400">请求量</p>
        <p class="text-2xl font-semibold">{{ metrics.requests }}</p>
      </div>
      <div class="bg-slate-900/70 rounded-2xl p-4">
        <p class="text-xs text-slate-400">成功率</p>
        <p class="text-2xl font-semibold">{{ (metrics.success_rate * 100).toFixed(1) }}%</p>
      </div>
      <div class="bg-slate-900/70 rounded-2xl p-4">
        <p class="text-xs text-slate-400">平均延迟</p>
        <p class="text-2xl font-semibold">{{ metrics.avg_latency?.toFixed(0) }} ms</p>
      </div>
    </div>
    <div class="bg-slate-900/70 rounded-2xl p-4">
      <h2 class="text-lg font-semibold mb-3">反馈统计</h2>
      <ul class="space-y-1 text-sm text-slate-300">
        <li v-for="item in metrics.feedback" :key="item.rating">
          {{ item.rating }}：{{ item.count }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import api from "@/api/client";

const metrics = reactive({ requests: 0, success_rate: 0, avg_latency: 0, feedback: [] as any[] });

onMounted(async () => {
  const res = await api.get("/v1/admin/overview");
  Object.assign(metrics, res.data.data);
});
</script>

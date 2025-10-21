<template>
  <div class="grid gap-4 md:grid-cols-2">
    <n-card>
      <template #header>请求统计</template>
      <div class="flex justify-between text-slate-600">
        <div>
          <div class="text-3xl font-semibold">{{ metrics.requests }}</div>
          <div class="text-sm">最近 24 小时请求量</div>
        </div>
        <div>
          <div class="text-3xl font-semibold text-emerald-500">{{ metrics.successRate }}%</div>
          <div class="text-sm">成功率</div>
        </div>
      </div>
    </n-card>
    <n-card>
      <template #header>模型耗时</template>
      <div class="text-3xl font-semibold text-indigo-500">{{ metrics.latency }} ms</div>
      <div class="text-sm text-slate-500">平均响应耗时</div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { NCard } from 'naive-ui';
import axios from 'axios';

const metrics = reactive({ requests: 0, successRate: 0, latency: 0 });

onMounted(async () => {
  try {
    const { data } = await axios.get('/admin/metrics');
    Object.assign(metrics, data);
  } catch (err) {
    // ignore
  }
});
</script>

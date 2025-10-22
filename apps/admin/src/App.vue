<template>
  <n-config-provider>
    <div class="min-h-screen bg-slate-100">
      <header class="bg-white border-b border-slate-200 py-4 px-8">
        <h1 class="text-xl font-semibold">分解力管理后台</h1>
      </header>
      <main class="p-8">
        <n-card>
          <template #header>部署概览</template>
          <p class="text-slate-600 text-sm">
            在这里查看请求日志、调整 Prompt、配置模型参数。
          </p>
        </n-card>
      </main>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NCard, NConfigProvider } from "naive-ui";
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>

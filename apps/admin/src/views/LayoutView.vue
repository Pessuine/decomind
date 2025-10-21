<template>
  <n-layout has-sider class="min-h-screen">
    <n-layout-sider collapse-mode="width" :collapsed-width="64" :width="220">
      <div class="p-4 text-white text-lg font-bold">分解力后台</div>
      <n-menu :value="menuValue" :options="menuOptions" @update:value="handleUpdate" />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered class="flex justify-between items-center px-6 py-3">
        <div class="font-semibold text-slate-700">{{ currentTitle }}</div>
        <n-button type="error" secondary size="small" @click="logout">退出</n-button>
      </n-layout-header>
      <n-layout-content class="p-6 bg-slate-50 min-h-[calc(100vh-56px)]">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NButton } from 'naive-ui';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const menuOptions = [
  { label: '仪表盘', key: 'dashboard', route: { name: 'dashboard' } },
  { label: '请求日志', key: 'logs', route: { name: 'logs' } },
  { label: 'Prompt 管理', key: 'prompts', route: { name: 'prompts' } },
  { label: '配置中心', key: 'config', route: { name: 'config' } }
];

const menuValue = computed(() => (route.name as string) || 'dashboard');
const currentTitle = computed(() => menuOptions.find((item) => item.key === menuValue.value)?.label || '仪表盘');

function handleUpdate(key: string) {
  const target = menuOptions.find((item) => item.key === key);
  if (target) router.push(target.route);
}

function logout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

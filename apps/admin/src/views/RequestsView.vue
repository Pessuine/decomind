<template>
  <AdminLayout @logout="logout">
    <div class="header">
      <h2>请求日志</h2>
    </div>
    <n-data-table :columns="columns" :data="rows" bordered>
      <template #empty>
        <div class="empty">暂无数据</div>
      </template>
    </n-data-table>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NDataTable } from 'naive-ui';
import AdminLayout from '../components/AdminLayout.vue';
import { useAuthStore } from '../stores/auth';

interface RequestRow {
  ts: string;
  endpoint: string;
  status: string;
  latency: number;
}

const rows = ref<RequestRow[]>([]);
const columns = [
  { title: '时间', key: 'ts' },
  { title: '接口', key: 'endpoint' },
  { title: '状态', key: 'status' },
  { title: '耗时(ms)', key: 'latency' },
];

const auth = useAuthStore();
const logout = () => {
  auth.logout();
  location.href = '/login';
};
</script>

<style scoped>
.header h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}
.empty {
  padding: 32px;
  color: rgba(148, 163, 184, 0.8);
}
</style>

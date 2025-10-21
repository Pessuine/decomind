<template>
  <AdminLayout @logout="logout">
    <div class="header">
      <h2>仪表盘</h2>
    </div>
    <div class="cards">
      <div class="card">
        <p class="label">今日请求</p>
        <p class="value">{{ metrics.requests }}</p>
      </div>
      <div class="card">
        <p class="label">成功率</p>
        <p class="value">{{ metrics.successRate }}%</p>
      </div>
      <div class="card">
        <p class="label">平均耗时</p>
        <p class="value">{{ metrics.latency }}ms</p>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import AdminLayout from '../components/AdminLayout.vue';
import { useAuthStore } from '../stores/auth';

const metrics = reactive({ requests: 0, successRate: 0, latency: 0 });
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
.cards {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
.card {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 16px;
  padding: 16px;
}
.label {
  text-transform: uppercase;
  font-size: 12px;
  color: rgba(148, 163, 184, 0.8);
}
.value {
  margin-top: 12px;
  font-size: 32px;
  font-weight: 600;
}
</style>

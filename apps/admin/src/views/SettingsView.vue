<template>
  <AdminLayout @logout="logout">
    <div class="header">
      <h2>系统配置</h2>
    </div>
    <div class="form-grid">
      <n-form-item label="API 域名">
        <n-input v-model:value="apiDomain" />
      </n-form-item>
      <n-form-item label="Admin 域名">
        <n-input v-model:value="adminDomain" />
      </n-form-item>
      <n-form-item label="风险关键词">
        <n-input type="textarea" v-model:value="riskKeywords" />
      </n-form-item>
    </div>
    <n-button type="primary" class="save">保存配置</n-button>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NFormItem, NInput, NButton } from 'naive-ui';
import AdminLayout from '../components/AdminLayout.vue';
import { useAuthStore } from '../stores/auth';

const apiDomain = ref('api.example.com');
const adminDomain = ref('another.com');
const riskKeywords = ref('违法,自杀,爆炸');
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
.form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  max-width: 720px;
}
.save {
  margin-top: 20px;
}
</style>

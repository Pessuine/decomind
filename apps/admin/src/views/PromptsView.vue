<template>
  <AdminLayout @logout="logout">
    <div class="header">
      <h2>Prompt 管理</h2>
    </div>
    <div class="panel">
      <n-select :options="promptOptions" v-model:value="currentPrompt" placeholder="选择 Prompt" />
      <n-input type="textarea" rows="12" v-model:value="content" />
      <div class="actions">
        <n-button type="primary">保存新版本</n-button>
        <n-button ghost>停用</n-button>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NSelect, NInput, NButton } from 'naive-ui';
import AdminLayout from '../components/AdminLayout.vue';
import { useAuthStore } from '../stores/auth';

const promptOptions = [
  { label: '行动步骤', value: 'action_step' },
  { label: '更简单', value: 'help_simpler' },
  { label: '换个做法', value: 'help_alt' },
  { label: '提示', value: 'help_hint' },
  { label: '拆分', value: 'help_split' },
  { label: '大纲', value: 'guide_outline' },
];

const currentPrompt = ref('action_step');
const content = ref('');
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
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 640px;
}
.actions {
  display: flex;
  gap: 12px;
}
</style>

<template>
  <div class="login">
    <div class="panel">
      <h1>控制台登录</h1>
      <n-form @submit.prevent="submit" :show-label="false">
        <n-form-item label="后台口令">
          <n-input v-model:value="password" type="password" placeholder="输入部署时设定的口令" />
        </n-form-item>
        <div v-if="auth.error" class="error">{{ auth.error }}</div>
        <n-button type="primary" :loading="auth.loading" attr-type="submit" block>
          登录
        </n-button>
      </n-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { NForm, NFormItem, NInput, NButton } from 'naive-ui';

const router = useRouter();
const auth = useAuthStore();
const password = ref('');

const submit = async () => {
  await auth.login({ password: password.value });
  router.push('/');
};
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #1e293b, #0f172a);
  color: #e2e8f0;
}
.panel {
  width: 100%;
  max-width: 360px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.4);
}
.panel h1 {
  font-size: 22px;
  margin-bottom: 24px;
}
.error {
  color: #fca5a5;
  font-size: 13px;
  margin-bottom: 12px;
}
</style>

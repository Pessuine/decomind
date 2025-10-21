<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100">
    <div class="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
      <h1 class="text-2xl font-semibold text-slate-800 mb-6 text-center">分解力后台登录</h1>
      <n-form :model="form" :rules="rules" ref="formRef" label-placement="top">
        <n-form-item label="后台密码" path="password">
          <n-input v-model:value="form.password" type="password" placeholder="输入后台密码" />
        </n-form-item>
        <n-form-item label="TOTP 动态码" path="totp">
          <n-input v-model:value="form.totp" placeholder="Authenticator 上的 6 位数字" />
        </n-form-item>
        <n-form-item>
          <n-button block type="primary" :loading="loading" @click="handleSubmit">登录</n-button>
        </n-form-item>
      </n-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { FormInst, useMessage, NForm, NFormItem, NInput, NButton } from 'naive-ui';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const message = useMessage();
const loading = ref(false);
const formRef = ref<FormInst | null>(null);
const form = reactive({ password: '', totp: '' });

const rules = {
  password: [{ required: true, message: '请输入后台密码' }],
  totp: [{ required: true, message: '请输入动态码' }]
};

function handleSubmit() {
  formRef.value?.validate(async (errors) => {
    if (errors) return;
    loading.value = true;
    try {
      await auth.login({ ...form });
      message.success('登录成功');
      router.push({ name: 'dashboard' });
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      loading.value = false;
    }
  });
}
</script>

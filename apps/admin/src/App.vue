<template>
  <n-config-provider>
    <n-message-provider>
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
        <div class="w-full max-w-md rounded-3xl bg-slate-900/80 border border-slate-800 p-8 shadow-2xl shadow-slate-950/60">
          <header class="space-y-1 mb-6">
            <h1 class="text-2xl font-semibold">分解力 · 管理后台</h1>
            <p class="text-sm text-slate-300">密码登录 · 强制域名校验 · 实时配置热更新</p>
          </header>
          <n-form :model="form" @submit.prevent="handleSubmit">
            <n-form-item label="访问密码">
              <n-input v-model:value="form.password" type="password" placeholder="请输入后台密码" />
            </n-form-item>
            <n-button type="primary" block round class="mt-4" @click="handleSubmit">登录</n-button>
          </n-form>
          <p class="text-xs text-slate-500 mt-6">
            所有敏感操作均会记录日志，建议部署后立即在「安全控制」中修改随机强密码。
          </p>
        </div>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { NButton, NForm, NFormItem, NInput, useMessage } from "naive-ui";

const message = useMessage();

interface LoginForm {
  password: string;
}

const form = reactive<LoginForm>({
  password: ""
});

function handleSubmit() {
  if (!form.password) {
    message.error("请输入后台密码");
    return;
  }
  message.info("登录流程将在 API 接入后启用");
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold">系统配置</h1>
    <form class="bg-slate-900/70 rounded-2xl p-6 space-y-4" @submit.prevent="save">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="text-xs text-slate-400">APP Domain</label>
          <input v-model="form.appDomain" class="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700" />
        </div>
        <div>
          <label class="text-xs text-slate-400">API Domain</label>
          <input v-model="form.apiDomain" class="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700" />
        </div>
        <div>
          <label class="text-xs text-slate-400">Admin Domain</label>
          <input v-model="form.adminDomain" class="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="text-xs text-slate-400">日志保留天数</label>
          <input type="number" v-model.number="form.logRetentionDays" class="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700" />
        </div>
        <div class="flex items-center gap-2 mt-6">
          <input type="checkbox" v-model="form.enableNginx" />
          <span class="text-xs text-slate-300">启用 Nginx</span>
        </div>
      </div>
      <div>
        <label class="text-xs text-slate-400">风控关键词（逗号分隔）</label>
        <input v-model="riskKeywords" class="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700" />
      </div>
      <div>
        <label class="text-xs text-slate-400">修改后台密码</label>
        <div class="flex gap-2">
          <input v-model="newPassword" type="password" placeholder="新密码" class="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700" />
          <button type="button" class="px-4 py-2 rounded-xl bg-indigo-500" @click="changePassword">修改</button>
        </div>
      </div>
      <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-500 text-black">保存配置</button>
      <p v-if="message" class="text-sm text-emerald-400">{{ message }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import api from "@/api/client";

const form = reactive({
  appDomain: "",
  apiDomain: "",
  adminDomain: "",
  enableNginx: false,
  logRetentionDays: 30,
  riskKeywords: [] as string[],
});
const newPassword = ref("");
const message = ref("");

const riskKeywords = computed({
  get: () => form.riskKeywords.join(","),
  set: (val: string) => {
    form.riskKeywords = val.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  },
});

const load = async () => {
  const res = await api.get("/v1/admin/system");
  Object.assign(form, res.data.data || {});
  form.riskKeywords = form.riskKeywords || [];
};

const save = async () => {
  await api.post("/v1/admin/system", form);
  message.value = "已保存";
  setTimeout(() => (message.value = ""), 1500);
};

const changePassword = async () => {
  if (newPassword.value.length < 8) {
    message.value = "密码至少 8 位";
    return;
  }
  await api.post("/v1/admin/password", { newPassword: newPassword.value });
  newPassword.value = "";
  message.value = "密码已更新";
  setTimeout(() => (message.value = ""), 1500);
};

onMounted(load);
</script>

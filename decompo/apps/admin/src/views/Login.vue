<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
    <div class="w-full max-w-sm bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-xl">
      <h1 class="text-xl font-semibold text-center">后台登录</h1>
      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="text-xs text-slate-400">密码</label>
          <input
            v-model="password"
            type="password"
            class="mt-2 w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <button
          type="submit"
          class="w-full py-2 rounded-xl bg-emerald-500 text-black font-semibold disabled:bg-slate-700"
          :disabled="store.loading"
        >
          登录
        </button>
      </form>
      <p v-if="store.error" class="text-xs text-rose-300 mt-3 text-center">{{ store.error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const store = useAuthStore();
const router = useRouter();
const password = ref("");

const submit = async () => {
  const ok = await store.login(password.value);
  if (ok) {
    router.push({ name: "dashboard" });
  }
};
</script>

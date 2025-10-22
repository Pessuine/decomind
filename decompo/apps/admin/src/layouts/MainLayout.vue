<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex">
    <aside class="w-64 bg-slate-900/80 border-r border-slate-800 hidden md:flex flex-col">
      <div class="px-6 py-6 text-lg font-semibold">Decompo 管理</div>
      <nav class="flex-1 px-4 space-y-2">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="block px-3 py-2 rounded-xl text-sm"
          :class="{
            'bg-emerald-500 text-black font-semibold': $route.name === link.name,
            'text-slate-300 hover:bg-slate-800': $route.name !== link.name,
          }"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
      <button class="m-4 px-3 py-2 rounded-xl bg-slate-800 text-sm" @click="logout">退出登录</button>
    </aside>
    <div class="flex-1 flex flex-col">
      <header class="md:hidden flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div class="font-semibold">Decompo 管理</div>
        <button @click="drawer = true" class="text-sm">菜单</button>
      </header>
      <main class="flex-1 p-6 overflow-y-auto">
        <RouterView />
      </main>
    </div>
    <transition name="fade">
      <div v-if="drawer" class="fixed inset-0 bg-black/70 z-40" @click="drawer = false"></div>
    </transition>
    <transition name="slide">
      <aside v-if="drawer" class="fixed top-0 left-0 bottom-0 w-64 bg-slate-900/95 z-50 p-4 space-y-3">
        <div class="text-lg font-semibold">导航</div>
        <RouterLink
          v-for="link in links"
          :key="link.to + '-drawer'"
          :to="link.to"
          class="block px-3 py-2 rounded-xl text-sm"
          @click="drawer = false"
        >
          {{ link.label }}
        </RouterLink>
        <button class="px-3 py-2 rounded-xl bg-slate-800 text-sm" @click="logout">退出登录</button>
      </aside>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();
const drawer = ref(false);
const links = [
  { name: "dashboard", to: { name: "dashboard" }, label: "仪表盘" },
  { name: "logs", to: { name: "logs" }, label: "请求日志" },
  { name: "prompts", to: { name: "prompts" }, label: "Prompt 管理" },
  { name: "model", to: { name: "model" }, label: "模型配置" },
  { name: "system", to: { name: "system" }, label: "系统配置" },
];

const logout = async () => {
  await auth.logout();
  router.push({ name: "login" });
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>

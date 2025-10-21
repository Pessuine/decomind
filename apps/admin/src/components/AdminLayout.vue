<template>
  <div class="layout">
    <aside class="sidebar">
      <h1 class="brand">分解力控制台</h1>
      <nav class="nav">
        <RouterLink to="/" class="nav-link">仪表盘</RouterLink>
        <RouterLink to="/requests" class="nav-link">请求日志</RouterLink>
        <RouterLink to="/prompts" class="nav-link">Prompt 管理</RouterLink>
        <RouterLink to="/settings" class="nav-link">系统配置</RouterLink>
      </nav>
      <button class="logout" @click="$emit('logout')">退出登录</button>
    </aside>
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px 1fr;
  background: #0f172a;
  color: #e2e8f0;
}
.sidebar {
  border-right: 1px solid rgba(148, 163, 184, 0.15);
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
}
.brand {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 32px;
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}
.nav-link {
  color: rgba(226, 232, 240, 0.8);
  text-decoration: none;
  font-size: 14px;
}
.nav-link.router-link-active {
  color: #fff;
  font-weight: 600;
}
.logout {
  background: transparent;
  border: none;
  color: rgba(148, 163, 184, 0.8);
  font-size: 12px;
  cursor: pointer;
  align-self: flex-start;
}
.content {
  padding: 32px;
}
@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
  .nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>

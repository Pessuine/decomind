import { createRouter, createWebHistory } from "vue-router";
import Login from "./views/Login.vue";
import Dashboard from "./views/Dashboard.vue";
import Prompts from "./views/Prompts.vue";
import Model from "./views/Model.vue";
import System from "./views/System.vue";
import Logs from "./views/Logs.vue";
import Layout from "./layouts/MainLayout.vue";
import { useAuthStore } from "./stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: Login },
    {
      path: "/",
      component: Layout,
      children: [
        { path: "", name: "dashboard", component: Dashboard },
        { path: "prompts", name: "prompts", component: Prompts },
        { path: "model", name: "model", component: Model },
        { path: "system", name: "system", component: System },
        { path: "logs", name: "logs", component: Logs },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.name !== "login" && !auth.isAuthenticated) {
    const ok = await auth.check();
    if (!ok) return { name: "login" };
  }
  if (to.name === "login" && auth.isAuthenticated) {
    return { name: "dashboard" };
  }
});

export default router;

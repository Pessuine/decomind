import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Execute from "./views/Execute.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: Home },
    { path: "/execute", name: "execute", component: Execute },
  ],
});

export default router;

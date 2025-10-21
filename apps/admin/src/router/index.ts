import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/',
    component: () => import('../views/LayoutView.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'logs', name: 'logs', component: () => import('../views/LogsView.vue') },
      { path: 'prompts', name: 'prompts', component: () => import('../views/PromptsView.vue') },
      { path: 'config', name: 'config', component: () => import('../views/ConfigView.vue') }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.name !== 'login' && !auth.isAuthed) {
    return { name: 'login' };
  }
  if (to.name === 'login' && auth.isAuthed) {
    return { name: 'dashboard' };
  }
});

export default router;

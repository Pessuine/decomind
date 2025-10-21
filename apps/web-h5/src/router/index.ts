import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/action', name: 'action', component: () => import('../views/ActionView.vue') },
  { path: '/guide', name: 'guide', component: () => import('../views/GuideView.vue') }
];

export default createRouter({
  history: createWebHistory(),
  routes
});

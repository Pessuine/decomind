import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ActionView from '../views/ActionView.vue';
import GuideView from '../views/GuideView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/action', name: 'action', component: ActionView },
    { path: '/guide', name: 'guide', component: GuideView },
  ],
});

export default router;

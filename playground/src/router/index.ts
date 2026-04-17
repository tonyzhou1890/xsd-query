import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/home/index.vue'),
  },
]
export const router = createRouter({
  history: createWebHistory(),
  routes,
})

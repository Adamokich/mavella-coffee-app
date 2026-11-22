import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'catalog',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/pages/FavoritesPage.vue'),
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('@/pages/CartPage.vue'),
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('@/pages/CheckoutPage.vue'),
    },
    {
      path: '/orders',
      name: 'order-history',
      component: () => import('@/pages/OrderHistoryPage.vue'),
      meta: { hideBottomNavigation: true },
    },
    {
      path: '/order-status/:orderId(\\d+)?',
      name: 'order-status',
      component: () => import('@/pages/OrderStatusPage.vue'),
      meta: { hideBottomNavigation: true },
    },
  ],
});

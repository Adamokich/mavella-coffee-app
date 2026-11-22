export const API_ROUTES = {
  catalog: '/catalog',
  orders: '/orders',
  orderStatus: (orderId: number): string => `/orders/${orderId}/status`,
  productModifier: (productId: number): string => `/product/${productId}/modifiers`,
} as const;

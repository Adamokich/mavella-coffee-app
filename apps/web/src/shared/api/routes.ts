export const API_ROUTES = {
  catalog: '/catalog',
  orders: '/orders',
  productModifier: (productId: number): string => `/product/${productId}/modifiers`,
} as const;

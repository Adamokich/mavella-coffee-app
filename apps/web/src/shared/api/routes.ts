export const API_ROUTES = {
  catalog: '/catalog',
  productModifier: (productId: number): string => `/product/${productId}/modifiers`,
} as const;

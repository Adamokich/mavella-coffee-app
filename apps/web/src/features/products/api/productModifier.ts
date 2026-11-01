import { API_ROUTES, apiClient } from '@/shared/api';
import { ProductWithModifiers } from '@coffee-app/contracts';

export async function getProductModifiers(id: number): Promise<ProductWithModifiers> {
  const { data } = await apiClient.get<ProductWithModifiers>(API_ROUTES.productModifier(id));

  return data;
}

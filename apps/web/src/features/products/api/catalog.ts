import type { Category, ProductWithModifiers } from '@coffee-app/contracts';
import { apiClient, API_ROUTES } from '@/shared/api';

export async function getCatalog(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>(API_ROUTES.catalog);

  return data;
}

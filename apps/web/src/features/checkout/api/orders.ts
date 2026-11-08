import type { CreateOrderRequest, CreateOrderResponse } from '@coffee-app/contracts';
import { API_ROUTES, apiClient } from '@/shared/api';

export async function createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
  const { data } = await apiClient.post<CreateOrderResponse>(API_ROUTES.orders, payload, {
    timeout: 10000,
  });
  if (
    !Number.isInteger(data?.id) ||
    !Number.isFinite(data.totalPriceRub) ||
    !['PENDING', 'READY', 'CANCELLED', 'COMPLETED'].includes(data.status)
  ) {
    throw new Error('Invalid order response');
  }
  return { id: data.id, status: data.status, totalPriceRub: data.totalPriceRub };
}

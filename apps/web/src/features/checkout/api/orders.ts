import {
  OrderStatus,
  type CreateOrderRequest,
  type CreateOrderResponse,
} from '@coffee-app/contracts/orders';
import { API_ROUTES, apiClient } from '@/shared/api';

const orderStatuses = Object.values(OrderStatus);

export async function createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
  const { data } = await apiClient.post<CreateOrderResponse>(API_ROUTES.orders, payload, {
    timeout: 10000,
  });
  if (
    !Number.isInteger(data?.id) ||
    !Number.isFinite(data.totalPriceRub) ||
    !orderStatuses.includes(data.status)
  ) {
    throw new Error('Invalid order response');
  }
  return {
    id: data.id,
    status: data.status,
    totalPriceRub: data.totalPriceRub,
    trackingToken: data.trackingToken,
  };
}

export async function getOrderStatus(
  orderId: number,
  trackingToken: string,
  signal: AbortSignal,
): Promise<unknown> {
  const { data } = await apiClient.get<unknown>(API_ROUTES.orderStatus(orderId), {
    headers: { 'X-Tracking-Token': trackingToken },
    signal,
    timeout: 10000,
  });
  return data;
}

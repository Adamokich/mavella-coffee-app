import { OrderStatus } from '@coffee-app/contracts/orders';
import type { OrderStatusSnapshot } from '../types';

const ORDER_STATUSES = Object.values(OrderStatus);

export function parseOrderStatusSnapshot(
  payload: unknown,
  orderId: number,
): OrderStatusSnapshot | null {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('orderId' in payload) ||
    payload.orderId !== orderId ||
    !('version' in payload) ||
    typeof payload.version !== 'number' ||
    !Number.isSafeInteger(payload.version) ||
    payload.version < 1 ||
    !('status' in payload)
  ) {
    return null;
  }

  const status = ORDER_STATUSES.find((value) => value === payload.status);
  return status ? { orderId, status, version: payload.version } : null;
}

export function isFinalOrderStatus(status: OrderStatus) {
  return status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED;
}

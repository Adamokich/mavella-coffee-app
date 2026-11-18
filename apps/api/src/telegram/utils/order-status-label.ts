import { OrderStatus } from '../../prisma/generated/prisma/enums.js';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: '🟡 Ожидают',
  PREPARING: '🔵 Готовятся',
  READY: '🟢 Готовы',
  COMPLETED: '✅ Выданы',
  CANCELLED: '❌ Отклонены',
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

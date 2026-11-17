import { Markup } from 'telegraf';
import { OrderStatus } from '../../prisma/generated/prisma/enums.js';

export function getOrderKeyboard(
  orderId: number,
  status: OrderStatus,
  originStatus?: OrderStatus,
  originPage?: number,
) {
  const suffix = !originStatus
    ? `${orderId}`
    : `${orderId}:${originStatus}:${originPage}`;

  switch (status) {
    case 'PENDING':
      return Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Принять', `order:accept:${suffix}`),
          Markup.button.callback('❌ Отклонить', `order:cancelled:${suffix}`),
        ],
      ]);
    case 'PREPARING':
      return Markup.inlineKeyboard([
        [Markup.button.callback('Готов к выдаче', `order:ready:${suffix}`)],
      ]);
    case 'READY':
      return Markup.inlineKeyboard([
        [Markup.button.callback('Заказ выдан', `order:complete:${suffix}`)],
      ]);
    default:
      return Markup.inlineKeyboard([]);
  }
}

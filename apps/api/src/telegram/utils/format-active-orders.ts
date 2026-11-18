import { OrderStatus } from '../../prisma/generated/prisma/enums.js';
import { getOrderStatusLabel } from './order-status-label.js';

export interface OrdersListItem {
  createdAt: Date;
  id: number;
}

export function formatActiveOrdersMessage(
  status: OrderStatus,
  orders: OrdersListItem[],
  page: number,
  totalPages: number,
): string {
  const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const header = [
    '☕ <b>MAVELLO | Активные заказы</b>',
    '',
    `<b>${getOrderStatusLabel(status)}</b>`,
    `🗒️ Показано заказов: <b>${orders.length}</b>`,
    '',
    '━━━━━━━━━━━━━━',
  ].join('\n');

  if (orders.length === 0) {
    return [
      header,
      '',
      '✅ В этой категории пока нет заказов.',
      '',
      'Вернитесь к списку категорий.',
    ].join('\n');
  }

  const orderList = orders
    .map((order, index) =>
      [
        `<b>${index + 1}. Заказ №${order.id}</b>`,
        `🕒 ${dateFormatter.format(order.createdAt)}`,
      ].join('\n'),
    )
    .join('\n\n');

  return [
    header,
    '',
    orderList,
    '',
    '━━━━━━━━━━━━━━',
    '',
    'Выберите заказ ниже, чтобы посмотреть',
    'подробности и управлять его статусом.',
    '',
    '━━━━━━━━━━━━━━',
    '',
    `📄 Страница ${page} из ${totalPages}`,
  ].join('\n');
}

import { Markup } from 'telegraf';
import { OrdersListItem } from '../utils/format-active-orders.js';
import { OrderStatus } from '../../prisma/generated/prisma/enums.js';

export function getActiveOrdersKeyboard(
  orders: OrdersListItem[],
  status: OrderStatus,
  page: number,
  totalPages: number,
) {
  const ordersButtons = orders.map((order) => [
    Markup.button.callback(
      `🗒️ Открыть заказ №${order.id}`,
      `active:order:${status}:${page}:${order.id}`,
    ),
  ]);

  const backButton = Markup.button.callback('← К категориям', `active:back`);

  const prevButton = Markup.button.callback(
    `← Назад`,
    `active:status:${status}:${page - 1}`,
  );
  const nextButton = Markup.button.callback(
    `Вперед →`,
    `active:status:${status}:${page + 1}`,
  );

  const paginationButtons = [];

  if (page > 1) {
    paginationButtons.push(prevButton);
  }

  if (page < totalPages) {
    paginationButtons.push(nextButton);
  }

  return Markup.inlineKeyboard([
    ...ordersButtons,
    ...(paginationButtons.length > 0 ? [paginationButtons] : []),
    [backButton],
  ]);
}

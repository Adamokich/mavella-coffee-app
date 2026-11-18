import { Markup } from 'telegraf';
import { OrderStatus } from '../../prisma/generated/prisma/enums.js';
import { getOrderKeyboard } from './order-keyboard.js';

export function getActiveOrderKeyboard(
  orderId: number,
  status: OrderStatus,
  originStatus: OrderStatus,
  originPage: number,
) {
  const keyboard = getOrderKeyboard(orderId, status, originStatus, originPage);
  const backButton = Markup.button.callback(
    '← Назад к списку',
    `active:status:${originStatus}:${originPage}`,
  );

  return Markup.inlineKeyboard([
    ...keyboard.reply_markup.inline_keyboard,
    [backButton],
  ]);
}

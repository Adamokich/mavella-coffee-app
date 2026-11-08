import { SavedOrderWithItems } from '../types/order.notififcation.type.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatOrderMessage(order: SavedOrderWithItems): string {
  const orderNumber = String(order.id).padStart(4, '0');

  const items = order.orderItems
    .map((item, index) => {
      const options = item.orderItemOptions
        .map(
          (option) =>
            `  • ${escapeHtml(option.modifierName)}: ${escapeHtml(option.optionName)}`,
        )
        .join('\n');

      const itemTotalPriceRub = item.unitPriceRub * item.quantity;

      return [
        `<b>${index + 1}. ${escapeHtml(item.productName)} × ${item.quantity}</b>`,
        options,
        `  └ (Сумма: <b>${itemTotalPriceRub.toLocaleString('ru-RU')} ₽</b>)`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  const lines = [
    `☕ <b>НОВЫЙ ЗАКАЗ #${orderNumber}</b>`,
    '📍 Самовывоз',
    '',
    '👤 <b>Информация о клиенте</b>',
    `Имя: ${escapeHtml(order.customerName)}`,
    `Телефон: ${escapeHtml(order.customerPhone)}`,
    '',
    '🧾 <b>Состав заказа</b>',
    items,
    '',
    `💰 <b>ИТОГО: ${order.totalPriceRub.toLocaleString('ru-RU')} ₽</b>`,
  ];

  if (order.comment?.trim()) {
    lines.push('', '💬 <b>Комментарий</b>', escapeHtml(order.comment));
  }

  return lines.join('\n');
}

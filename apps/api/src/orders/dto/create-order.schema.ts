import { PHONE_NUMBER_REGEX } from '@coffee-app/constants';
import { formatNumberPhone } from '@coffee-app/utils';
import { z } from 'zod';
import { orderItemSchema } from './create-order-item.schema.js';

export const createOrderSchema = z.strictObject({
  idempotencyKey: z.uuidv4({ error: 'Некорректный UUID v4' }),
  customerName: z
    .string()
    .trim()
    .min(3, {
      error: (issue) =>
        `Минимально количество допустимых символов - ${issue.minimum}`,
    })
    .max(20, {
      error: (issue) =>
        `Максимальное количество допустимых символов - ${issue.maximum}`,
    }),
  customerPhone: z
    .string()
    .trim()
    .transform(formatNumberPhone)
    .refine((phone) => PHONE_NUMBER_REGEX.test(phone), {
      error: 'Неверный формат телефона',
    }),
  comment: z
    .string()
    .trim()
    .max(200, {
      error: (issue) =>
        `Комментарий не может превышать ${issue.maximum} символов`,
    })
    .optional(),
  items: z
    .array(orderItemSchema)
    .min(1, { error: 'Заказ не может быть пустым' })
    .max(10, {
      error: (issue) => `Заказ не может превышать ${issue.maximum} позиций`,
    }),
});

export type CreateOrderSchema = z.infer<typeof createOrderSchema>;

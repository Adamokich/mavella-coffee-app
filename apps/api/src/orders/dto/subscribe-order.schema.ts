import z from 'zod';

export const subscribeOrderSchema = z.strictObject({
  orderId: z
    .number({ error: 'Ошибка. Номер заказа должен быть числового формата' })
    .int()
    .min(1, { error: 'Ошибка. Не указан номер заказа' }),
  trackingToken: z
    .string({ error: 'Ошибка. Токен должен быть строкового формата' })
    .nonempty({ error: 'Ошибка. Не указан токен отслеживания заказа' })
    .regex(/^[a-f0-9]{64}$/, { error: 'Некорректный формат токена' }),
});

export type SubscribeOrderSchema = z.infer<typeof subscribeOrderSchema>;

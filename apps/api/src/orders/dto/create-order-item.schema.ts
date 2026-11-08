import { z } from 'zod';

export const orderItemSchema = z.strictObject({
  productId: z
    .number()
    .int()
    .positive({ error: 'Идентификатор позиции должен быть положительным' }),
  quantity: z.number().int().min(1).max(20),
  selectedOptionIds: z
    .array(
      z
        .number({ error: 'Элементы массива должны иметь числовые значения' })
        .int()
        .positive(),
    )
    .max(30, { error: 'Слишком много выбранных опций!' })
    .superRefine((arr, ctx) => {
      const seen = new Set<number>();
      const duplicates = new Set<number>();

      arr.forEach((num) => {
        if (seen.has(num)) {
          duplicates.add(num);
        } else {
          seen.add(num);
        }
      });

      if (duplicates.size > 0) {
        ctx.addIssue({
          code: 'custom',
          message: `Массив содержит следующие дубликаты ${[...duplicates].join(', ')}`,
          path: [],
        });
      }
    }),
});

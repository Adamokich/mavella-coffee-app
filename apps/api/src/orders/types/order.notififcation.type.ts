import { Prisma } from '../../prisma/generated/prisma/client.js';

export type SavedOrderWithItems = Prisma.OrderGetPayload<{
  include: {
    orderItems: {
      include: {
        orderItemOptions: true;
      };
    };
  };
}>;

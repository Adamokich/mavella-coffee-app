import { OrderStatus, Prisma } from '../../prisma/generated/prisma/client.js';

export interface Order {
  id: number;
  status: string;
  totalPriceRub: number;
  trackingToken: string;
}

export type SavedOrderWithItems = Prisma.OrderGetPayload<{
  include: {
    orderItems: {
      include: {
        orderItemOptions: true;
      };
    };
  };
}>;

export interface SubscribeOrderPayload {
  orderId: number;
  trackingToken: string;
}

export interface OrderStatusPayload {
  orderId: number;
  status: OrderStatus;
  version: number;
}

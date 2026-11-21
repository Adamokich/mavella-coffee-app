import { OrderStatus } from "../../../apps/api/src/prisma/generated/prisma/enums.js";

export { OrderStatus };

export interface CreateOrderItem {
  productId: number;
  quantity: number;
  selectedOptionIds: number[];
}

export interface CreateOrderRequest {
  idempotencyKey: string;
  customerName: string;
  customerPhone: string;
  comment?: string;
  items: CreateOrderItem[];
}

export interface CreateOrderResponse {
  id: number;
  status: OrderStatus;
  totalPriceRub: number;
  trackingToken: string;
}

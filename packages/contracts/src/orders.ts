export type OrderStatus = "PENDING" | "READY" | "CANCELLED" | "COMPLETED";

export interface CreateOrderItem {
  productId: number;
  quantity: number;
  selectedOptionIds: number[];
}

export interface CreateOrderRequest {
  idompotencyKey: string;
  customerName: string;
  customerPhone: string;
  comment?: string;
  items: CreateOrderItem[];
}

export interface CreateOrderResponse {
  id: number;
  status: OrderStatus;
  totalPriceRub: number;
}

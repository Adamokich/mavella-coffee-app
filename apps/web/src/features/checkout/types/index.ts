import type { CreateOrderRequest, CreateOrderResponse, OrderStatus } from '@coffee-app/contracts';

export interface OrderStatusSnapshot {
  orderId: number;
  status: OrderStatus;
  version: number;
}

export interface CheckoutItemSummary {
  name: string;
  imageUrl?: string;
  options: string[];
  quantity: number;
  total: number | null;
}

export interface PendingSubmission {
  payload: CreateOrderRequest;
  summary: CheckoutItemSummary[];
  submittedAt?: number;
}

export interface OrderConfirmation extends CreateOrderResponse {
  summary: CheckoutItemSummary[];
  submittedAt?: number;
  version?: number;
}

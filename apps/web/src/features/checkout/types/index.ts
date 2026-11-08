import type { CreateOrderRequest } from '@coffee-app/contracts';

export interface CheckoutItemSummary {
  name: string;
  options: string[];
  quantity: number;
  total: number | null;
}

export interface PendingSubmission {
  payload: CreateOrderRequest;
  summary: CheckoutItemSummary[];
}

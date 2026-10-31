import type { Product } from '@coffee-app/contracts';

export interface CartItem {
  product: Product;
  quantity: number;
}

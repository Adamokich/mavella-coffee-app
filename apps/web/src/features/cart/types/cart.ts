import type { ModifierOption, Product } from '@coffee-app/contracts';

export interface CartItem {
  product: Product;
  quantity: number;
  options: ModifierOption[] | null;
}

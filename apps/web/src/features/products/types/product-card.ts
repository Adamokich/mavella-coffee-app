import type { Product } from '@coffee-app/contracts';

export interface ProductCardProps {
  product: Product;
  isFavorite?: boolean;
}

export interface ProductCardEmits {
  add: [product: Product];
  favorite: [product: Product];
}

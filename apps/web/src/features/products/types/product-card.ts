import type { Product } from '@coffee-app/contracts';

export interface ProductCardProps {
  product: Product;
}

export interface ProductCardEmits {
  add: [product: Product];
  favorite: [product: Product, isFavorite: boolean];
}

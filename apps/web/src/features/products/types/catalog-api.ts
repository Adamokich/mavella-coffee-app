import type { Category, Product } from '@coffee-app/contracts';

export type CatalogCategoryId = 'all' | number;

export interface CatalogSection {
  category: Category;
  products: readonly Product[];
}

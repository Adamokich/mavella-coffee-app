import type { Product } from "./products";

export interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  products: Product[];
}

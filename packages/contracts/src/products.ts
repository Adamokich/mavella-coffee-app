export interface Product {
  id: number;
  name: string;
  description: string | null;
  servingLabel: string | null;
  badgeText: string | null;
  priceRub: number;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

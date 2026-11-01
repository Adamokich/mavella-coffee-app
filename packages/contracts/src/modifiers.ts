import type { Product } from "./products";

export interface ModifierOption {
  id: number;
  name: string;
  priceDelta: number;
  modifierId: number;
}

export interface Modifier {
  id: number;
  name: string;
  modifierOptions: ModifierOption[];
}

export interface ProductModifier {
  productId: number;
  modifierId: number;
  modifierOptionId: number | null;
  minSelected: number;
  maxSelected: number;
  defaultOption: ModifierOption | null;
  modifier: Modifier;
}

export interface ProductWithModifiers extends Product {
  modifiers: ProductModifier[];
}

export interface CalculatedOrderOption {
  modifierOptionId: number;
  modifierName: string;
  optionName: string;
  priceDeltaRub: number;
}

export interface CalculatedOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPriceRub: number;
  options: CalculatedOrderOption[];
}

export interface CalculatedOrder {
  totalPriceRub: number;
  items: CalculatedOrderItem[];
}

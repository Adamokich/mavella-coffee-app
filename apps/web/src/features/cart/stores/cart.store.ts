import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { ModifierOption, Product } from '@coffee-app/contracts';
import type { CartItem } from '../types';

const CART_STORAGE_KEY = 'coffee-app:cart';

export function getCartItemTotal(item: CartItem): number | null {
  if (
    !Number.isFinite(item.product.priceRub) ||
    item.options?.some((option) => !Number.isFinite(option.priceDeltaRub))
  )
    return null;

  return (
    (item.product.priceRub +
      (item.options ?? []).reduce((sum, option) => sum + option.priceDeltaRub, 0)) *
    item.quantity
  );
}

function getStoredCartItems(): CartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (item) =>
          item &&
          typeof item.product?.id === 'number' &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0,
      )
      .map((item) => ({
        ...item,
        options: Array.isArray(item.options)
          ? item.options.map((option: ModifierOption & { priceDelta?: number }) => ({
              ...option,
              priceDeltaRub: option.priceDeltaRub ?? option.priceDelta,
            }))
          : null,
      }));
  } catch {
    return [];
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(getStoredCartItems());
  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0));
  const total = computed(() => {
    const prices = items.value.map(getCartItemTotal);
    return prices.some((price) => price === null)
      ? null
      : prices.reduce<number>((sum, price) => sum + (price ?? 0), 0);
  });

  function persist() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.value));
  }

  function findItem(product: Product, options: ModifierOption[]) {
    const ids = options
      .map((option) => option.id)
      .sort((a, b) => a - b)
      .join(',');
    return items.value.find(
      (item) =>
        item.product.id === product.id &&
        item.options !== null &&
        item.options
          .map((option) => option.id)
          .sort((a, b) => a - b)
          .join(',') === ids,
    );
  }

  function remainingQuantity(product: Product, options: ModifierOption[]) {
    return Math.max(0, 20 - (findItem(product, options)?.quantity ?? 0));
  }

  function addProduct(product: Product, options: ModifierOption[], quantity = 1) {
    const existing = findItem(product, options);
    const amount = Math.min(Math.max(0, Math.floor(quantity)), remainingQuantity(product, options));
    if (!amount) return;
    if (existing) existing.quantity += amount;
    else items.value.push({ product, options, quantity: amount });
    persist();
  }

  function changeQuantity(item: CartItem, delta: number) {
    const index = items.value.indexOf(item);
    if (index < 0) return;
    const quantity = item.quantity + delta;
    if (quantity <= 0) items.value.splice(index, 1);
    else if (quantity <= 20) item.quantity = quantity;
    persist();
  }

  function clear() {
    items.value = [];
    persist();
  }

  function restoreOptionPrices(productId: number, options: ModifierOption[]) {
    for (const item of items.value) {
      if (item.product.id !== productId || item.options === null) continue;
      item.options = item.options.map((option) => {
        if (Number.isFinite(option.priceDeltaRub)) return option;
        return options.find((candidate) => candidate.id === option.id) ?? option;
      });
    }
    persist();
  }

  return {
    items,
    count,
    total,
    addProduct,
    remainingQuantity,
    changeQuantity,
    clear,
    restoreOptionPrices,
  };
});

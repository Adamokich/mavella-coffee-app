import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { Product } from '@coffee-app/contracts';

import type { CartItem } from '../types';

const CART_STORAGE_KEY = 'coffee-app:cart';

function getStoredCartItems(): CartItem[] {
  try {
    const storedValue = localStorage.getItem(CART_STORAGE_KEY);
    const parsedValue: unknown = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (item): item is CartItem =>
            typeof item === 'object' &&
            item !== null &&
            'quantity' in item &&
            typeof item.quantity === 'number' &&
            'product' in item &&
            typeof item.product === 'object' &&
            item.product !== null &&
            'id' in item.product &&
            typeof item.product.id === 'number',
        )
      : [];
  } catch {
    return [];
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(getStoredCartItems());

  function persist() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.value));
  }

  function addProduct(product: Product) {
    const existingItem = items.value.find((item) => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      items.value.push({ product, quantity: 1 });
    }

    persist();
  }

  return { items, addProduct };
});

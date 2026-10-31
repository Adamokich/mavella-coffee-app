import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { Product } from '@coffee-app/contracts';

import type { CartItem } from '../types';

const CART_STORAGE_KEY = 'coffee-app:cart';

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('quantity' in value) || typeof value.quantity !== 'number') {
    return false;
  }

  if (!('product' in value) || typeof value.product !== 'object' || value.product === null) {
    return false;
  }

  return 'id' in value.product && typeof value.product.id === 'number';
}

function getStoredCartItems(): CartItem[] {
  try {
    const storedValue = localStorage.getItem(CART_STORAGE_KEY);
    const parsedValue: unknown = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue) ? parsedValue.filter(isCartItem) : [];
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

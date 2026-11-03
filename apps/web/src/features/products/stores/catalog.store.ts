import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { Category, ProductWithModifiers } from '@coffee-app/contracts';

import { getCatalog } from '../api/catalog';
import { getProductModifiers } from '../api/productModifier';
import type { CatalogSection } from '../types';

export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref<Category[]>([]);
  const products = computed(() => categories.value.flatMap((category) => category.products));
  const modifierCache = ref<Record<number, ProductWithModifiers>>({});
  const modifierRequests = new Map<number, Promise<ProductWithModifiers>>();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const sections = computed<CatalogSection[]>(() =>
    categories.value.map((category) => ({
      category,
      products: category.products,
    })),
  );

  async function loadCatalog() {
    isLoading.value = true;
    error.value = null;

    try {
      categories.value = await getCatalog();
    } catch {
      error.value = 'Не удалось загрузить каталог. Проверьте подключение и попробуйте ещё раз.';
    } finally {
      isLoading.value = false;
    }
  }

  async function loadProductModifiers(productId: number): Promise<ProductWithModifiers> {
    const cachedModifiers = modifierCache.value[productId];

    if (cachedModifiers) {
      return cachedModifiers;
    }

    const pendingRequest = modifierRequests.get(productId);

    if (pendingRequest) {
      return pendingRequest;
    }

    const request = getProductModifiers(productId)
      .then((productWithModifiers) => {
        modifierCache.value = {
          ...modifierCache.value,
          [productId]: productWithModifiers,
        };

        return productWithModifiers;
      })
      .finally(() => {
        modifierRequests.delete(productId);
      });

    modifierRequests.set(productId, request);

    return request;
  }

  return {
    categories,
    products,
    modifierCache,
    isLoading,
    error,
    sections,
    loadCatalog,
    loadProductModifiers,
  };
});

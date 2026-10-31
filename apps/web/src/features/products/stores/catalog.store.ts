import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { Category } from '@coffee-app/contracts';

import { getCatalog } from '../api/catalog';
import type { CatalogSection } from '../types';

export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref<Category[]>([]);
  const products = computed(() => categories.value.flatMap((category) => category.products));
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

  return { categories, products, isLoading, error, sections, loadCatalog };
});

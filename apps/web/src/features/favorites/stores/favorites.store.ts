import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

const FAVORITES_STORAGE_KEY = 'coffee-app:favorites';

function getStoredFavoriteIds(): number[] {
  try {
    const storedValue = localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter((id): id is number => typeof id === 'number')
      : [];
  } catch {
    return [];
  }
}

export const useFavoritesStore = defineStore('favorites', () => {
  const favoriteIds = ref<Set<number>>(new Set(getStoredFavoriteIds()));
  const count = computed(() => favoriteIds.value.size);

  function persist() {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favoriteIds.value]));
  }

  function isFavorite(productId: number) {
    return favoriteIds.value.has(productId);
  }

  function toggleFavorite(productId: number) {
    const nextFavoriteIds = new Set(favoriteIds.value);

    if (nextFavoriteIds.has(productId)) {
      nextFavoriteIds.delete(productId);
    } else {
      nextFavoriteIds.add(productId);
    }

    favoriteIds.value = nextFavoriteIds;
    persist();
  }

  return { count, isFavorite, toggleFavorite };
});

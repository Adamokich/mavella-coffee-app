<script setup lang="ts">
  import { computed, onMounted } from 'vue';

  import { useCartStore } from '@/features/cart';
  import { useFavoritesStore } from '@/features/favorites';
  import { CatalogSkeleton, ProductCard, useCatalogStore } from '@/features/products';

  const catalogStore = useCatalogStore();
  const cartStore = useCartStore();
  const favoritesStore = useFavoritesStore();

  const favoriteProducts = computed(() =>
    catalogStore.products.filter((product) => favoritesStore.isFavorite(product.id)),
  );

  onMounted(() => {
    if (!catalogStore.categories.length) {
      void catalogStore.loadCatalog();
    }
  });
</script>

<template>
  <section class="favorites-page" aria-labelledby="favorites-heading">
    <header class="favorites-header">
      <h1 id="favorites-heading">Избранное</h1>
      <p>Ваши любимые напитки</p>
    </header>

    <CatalogSkeleton v-if="catalogStore.isLoading" />

    <section v-else-if="catalogStore.error" class="favorites-message" role="alert">
      <h2>Не удалось загрузить избранное</h2>
      <p>{{ catalogStore.error }}</p>
      <button type="button" @click="catalogStore.loadCatalog">Повторить</button>
    </section>

    <TransitionGroup
      v-else
      name="favorites-list"
      tag="section"
      class="favorites-grid"
      aria-label="Товары в избранном"
    >
      <ProductCard
        v-for="product in favoriteProducts"
        :key="product.id"
        :product="product"
        :is-favorite="true"
        @add="cartStore.addProduct"
        @favorite="favoritesStore.toggleFavorite(product.id)"
      />
    </TransitionGroup>

    <section v-if="!favoriteProducts.length && !catalogStore.isLoading" class="favorites-message">
      <h2>Здесь пока пусто</h2>
      <p>Добавляйте напитки с помощью сердечка, чтобы быстро находить их снова.</p>
      <RouterLink to="/">Перейти в каталог</RouterLink>
    </section>
  </section>
</template>

<style scoped>
  .favorites-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px 16px;
  }

  .favorites-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .favorites-header p,
  .favorites-message p {
    color: var(--color-text-secondary);
    font-size: var(--font-size-secondary);
    font-weight: var(--font-weight-regular);
  }

  .favorites-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .favorites-list-enter-active,
  .favorites-list-leave-active,
  .favorites-list-move {
    transition:
      opacity 220ms ease,
      transform 220ms ease;
  }

  .favorites-list-enter-from,
  .favorites-list-leave-to {
    opacity: 0;
    transform: scale(0.96);
  }

  .favorites-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px 16px;
    background: var(--color-card);
    border: 1px dashed var(--color-border);
    border-radius: 16px;
    text-align: center;
  }

  .favorites-message a,
  .favorites-message button {
    min-height: 44px;
    padding: 0 18px;
    color: var(--color-background);
    background: var(--color-accent);
    border: 0;
    border-radius: 12px;
    font: inherit;
    font-weight: var(--font-weight-semibold);
    line-height: 44px;
    text-decoration: none;
  }

  .favorites-message button {
    cursor: pointer;
  }

  .favorites-message a:focus-visible,
  .favorites-message button:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .favorites-list-enter-active,
    .favorites-list-leave-active,
    .favorites-list-move {
      transition: none;
    }
  }

  @media (min-width: 640px) {
    .favorites-page {
      padding: 32px 24px;
    }

    .favorites-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>


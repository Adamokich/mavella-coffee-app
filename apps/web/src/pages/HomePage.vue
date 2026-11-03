<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import type { Component, ComponentPublicInstance } from 'vue';

  import {
    CatalogSkeleton,
    ProductCard,
    CatalogProvider,
    useCatalogStore,
    type CatalogCategoryId,
  } from '@/features/products';
  import { useFavoritesStore } from '@/features/favorites';
  import {
    CategoryAllIcon,
    CoffeeIcon,
    ColdDrinkIcon,
    DessertIcon,
    SearchIcon,
    TeaIcon,
  } from '@/shared/icons/category';
  import { MavellaLogo } from '@/shared/icons';
  import { useFixedElement } from '@/shared/composables';

  const catalogStore = useCatalogStore();
  const favoritesStore = useFavoritesStore();
  const activeCategoryId = ref<CatalogCategoryId>('all');
  const searchQuery = ref('');
  const { element: catalogControlsWrapper, isFixed: isCatalogControlsFixed } = useFixedElement();

  const categoryIcons: Record<string, Component> = {
    coffee: CoffeeIcon,
    tea: TeaIcon,
    dessert: DessertIcon,
    cold: ColdDrinkIcon,
  };

  const categoryTabs = ref<HTMLElement | null>(null);
  const categoryTabElements = new Map<CatalogCategoryId, HTMLElement>();
  const categoryTabIndicatorStyle = ref({
    opacity: '0',
    transform: 'translateX(0)',
    width: '0',
  });
  const categoryTabItems = computed(() => [
    { id: 'all' as const, name: 'Все', icon: CategoryAllIcon },
    ...catalogStore.categories.map((category) => ({
      id: category.id,
      name: category.name,
      icon: getCategoryIcon(category.slug),
    })),
  ]);

  const activeCategory = computed(() =>
    activeCategoryId.value === 'all'
      ? { id: 'all', name: 'Все' }
      : catalogStore.categories.find((category) => category.id === activeCategoryId.value),
  );

  const normalizedSearchQuery = computed(() => searchQuery.value.trim().toLocaleLowerCase('ru-RU'));

  const displayedProducts = computed(() => {
    const productsByCategory =
      activeCategoryId.value === 'all'
        ? catalogStore.products
        : catalogStore.products.filter((product) => product.categoryId === activeCategoryId.value);

    return normalizedSearchQuery.value
      ? productsByCategory.filter((product) =>
          `${product.name} ${product.description ?? ''}`
            .toLocaleLowerCase('ru-RU')
            .includes(normalizedSearchQuery.value),
        )
      : productsByCategory;
  });

  const displayedProductIds = computed(
    () => new Set(displayedProducts.value.map((product) => product.id)),
  );

  const catalogSections = computed(() =>
    catalogStore.sections
      .map((section) => ({
        ...section,
        products: section.products.filter((product) => displayedProductIds.value.has(product.id)),
      }))
      .filter((section) => section.products.length),
  );

  function getCategoryIcon(slug: string): Component {
    return categoryIcons[slug] ?? CategoryAllIcon;
  }

  function setCategoryTabElement(
    categoryId: CatalogCategoryId,
    element: Element | ComponentPublicInstance | null,
  ) {
    if (element instanceof HTMLElement) {
      categoryTabElements.set(categoryId, element);
      return;
    }

    categoryTabElements.delete(categoryId);
  }

  function updateCategoryTabIndicator() {
    const activeTab = categoryTabElements.get(activeCategoryId.value);

    if (!categoryTabs.value || !activeTab) {
      return;
    }

    categoryTabIndicatorStyle.value = {
      opacity: '1',
      transform: `translateX(${activeTab.offsetLeft}px)`,
      width: `${activeTab.offsetWidth}px`,
    };
  }

  function selectCategory(categoryId: CatalogCategoryId) {
    activeCategoryId.value = categoryId;
  }

  onMounted(() => {
    window.addEventListener('resize', updateCategoryTabIndicator);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateCategoryTabIndicator);
  });

  watch([activeCategoryId, categoryTabItems], updateCategoryTabIndicator, {
    flush: 'post',
  });

  watch(categoryTabs, updateCategoryTabIndicator, {
    flush: 'post',
  });
</script>

<template>
  <CatalogProvider v-slot="{ openModal }">
    <section class="home-page" aria-labelledby="catalog-heading">
      <header class="catalog-header">
        <div class="catalog-intro">
          <MavellaLogo class="brand-logo" />
          <p class="greeting">Добро пожаловать</p>

          <h1 id="catalog-heading" class="catalog-title">Наш каталог</h1>
        </div>

        <div ref="catalogControlsWrapper" class="catalog-controls-wrapper">
          <div
            class="catalog-controls"
            :class="{ 'catalog-controls--fixed': isCatalogControlsFixed }"
          >
            <div class="search-field">
              <span class="visually-hidden">Поиск напитков или десертов</span>

              <SearchIcon class="search-icon" />

              <input
                v-model="searchQuery"
                type="search"
                placeholder="Найти напиток или десерт..."
              />
            </div>

            <div
              ref="categoryTabs"
              v-if="!catalogStore.isLoading"
              class="category-tabs"
              role="tablist"
              aria-label="Категории каталога"
            >
              <span
                class="category-tab-indicator"
                :style="categoryTabIndicatorStyle"
                aria-hidden="true"
              />

              <button
                v-for="category in categoryTabItems"
                :ref="(element) => setCategoryTabElement(category.id, element)"
                :id="`category-tab-${category.id}`"
                :key="category.id"
                type="button"
                class="category-tab"
                :class="{ 'category-tab--active': category.id === activeCategoryId }"
                role="tab"
                :aria-controls="`category-panel-${category.id}`"
                :aria-selected="category.id === activeCategoryId"
                :tabindex="category.id === activeCategoryId ? 0 : -1"
                @click="selectCategory(category.id)"
              >
                <component :is="category.icon" class="category-icon" />
                <span>{{ category.name }}</span>
              </button>
            </div>

            <div v-else class="category-tabs category-tabs--loading" aria-hidden="true">
              <span v-for="index in 4" :key="index" class="category-tab-skeleton" />
            </div>
          </div>
        </div>
      </header>

      <CatalogSkeleton v-if="catalogStore.isLoading" />

      <section v-else-if="catalogStore.error" class="catalog-error" role="alert">
        <h2>Не удалось загрузить каталог</h2>
        <p>{{ catalogStore.error }}</p>
        <button type="button" class="retry-button" @click="catalogStore.loadCatalog">
          Повторить
        </button>
      </section>

      <Transition v-else name="catalog" mode="out-in">
        <section
          :id="`category-panel-${activeCategoryId}`"
          :key="activeCategoryId"
          class="catalog-panel"
          role="tabpanel"
          :aria-labelledby="`category-tab-${activeCategoryId}`"
        >
          <template v-if="displayedProducts.length">
            <template v-if="activeCategoryId === 'all'">
              <section
                v-for="section in catalogSections"
                :key="section.category.id"
                class="catalog-section"
                :aria-labelledby="`catalog-section-${section.category.id}`"
              >
                <h2 :id="`catalog-section-${section.category.id}`" class="catalog-section-title">
                  {{ section.category.name }}
                </h2>

                <div class="catalog-grid">
                  <ProductCard
                    v-for="product in section.products"
                    :key="product.id"
                    :product="product"
                    :is-favorite="favoritesStore.isFavorite(product.id)"
                    @add="openModal"
                    @favorite="favoritesStore.toggleFavorite(product.id)"
                  />
                </div>
              </section>
            </template>

            <div v-else class="catalog-grid">
              <ProductCard
                v-for="product in displayedProducts"
                :key="product.id"
                :product="product"
                :is-favorite="favoritesStore.isFavorite(product.id)"
                @add="openModal"
                @favorite="favoritesStore.toggleFavorite(product.id)"
              />
            </div>
          </template>

          <div v-else class="catalog-placeholder">
            <h2>{{ activeCategory?.name }}</h2>
            <p>
              {{
                searchQuery
                  ? 'По вашему запросу ничего не найдено.'
                  : 'В этой категории пока нет позиций.'
              }}
            </p>
          </div>
        </section>
      </Transition>
    </section>
  </CatalogProvider>
</template>

<style scoped>
  .home-page {
    --home-page-inline-padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 8px 16px 24px;
  }

  .catalog-header {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .catalog-controls-wrapper {
    min-height: calc(var(--control-height-search) + var(--control-height-category) + 15px);
  }

  .catalog-controls {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .catalog-controls--fixed {
    position: fixed;
    top: env(safe-area-inset-top);
    right: max(
      var(--home-page-inline-padding),
      calc((100vw - 1024px) / 2 + var(--home-page-inline-padding))
    );
    left: max(
      var(--home-page-inline-padding),
      calc((100vw - 1024px) / 2 + var(--home-page-inline-padding))
    );
    z-index: 10;
    padding-block: 8px;
    background: var(--color-background);
  }

  .catalog-intro {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .brand-logo {
    width: 230px;
    height: auto;
    color: var(--color-accent);
  }

  .greeting {
    color: var(--color-text-secondary);
    font-size: var(--font-size-greeting);
    font-weight: var(--font-weight-medium);
    line-height: 1.4;
  }

  .catalog-title {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-text);
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-bold);
    line-height: 1.25;
  }

  .search-field {
    display: flex;
    align-items: center;
    gap: 10px;
    height: var(--control-height-search);
    padding: 0 8px 0 12px;
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
  }

  .search-icon {
    width: var(--icon-size-search);
    height: var(--icon-size-search);
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.7;
  }

  .search-field input {
    min-width: 0;
    flex: 1;
    color: var(--color-text);
    background: transparent;
    border: 0;
    outline: 0;
    font: inherit;
    font-size: var(--font-size-body);
  }

  .search-field input::placeholder {
    color: var(--color-text-secondary);
    opacity: 0.7;
  }

  .category-tab:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .category-tabs {
    display: flex;
    gap: 8px;
    margin-right: -16px;
    padding-right: 16px;
    overflow-x: auto;
    position: relative;
    isolation: isolate;
    scrollbar-width: none;
  }

  .category-tabs::-webkit-scrollbar {
    display: none;
  }

  .category-tabs--loading {
    pointer-events: none;
  }

  .category-tab-skeleton {
    width: 100px;
    height: var(--control-height-category);
    flex: 0 0 auto;
    background: linear-gradient(
      100deg,
      var(--color-surface) 30%,
      var(--color-card) 50%,
      var(--color-surface) 70%
    );
    background-size: 200% 100%;
    border-radius: 10px;
    animation: category-tab-shimmer 1.4s ease-in-out infinite;
  }

  .category-tab-indicator {
    position: absolute;
    top: 0;
    left: 0;
    height: var(--control-height-category);
    pointer-events: none;
    background: var(--color-accent);
    border: 1px solid var(--color-accent);
    border-radius: 10px;
    transition:
      width 240ms ease,
      transform 240ms ease,
      opacity 120ms ease;
    z-index: 1;
  }

  .category-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: var(--control-height-category);
    flex: 0 0 auto;
    padding: 0 12px;
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    font: inherit;
    font-size: var(--font-size-category);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }

  .category-tab--active {
    color: var(--color-background);
  }

  .category-tab > * {
    position: relative;
    z-index: 2;
  }

  .category-icon {
    width: var(--icon-size-category);
    height: var(--icon-size-category);
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.6;
  }

  .catalog-panel {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .catalog-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .catalog-section-title {
    color: var(--color-text);
    font-size: var(--font-size-section-heading);
    font-weight: var(--font-weight-bold);
    line-height: 1.25;
  }

  .catalog-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .catalog-placeholder {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 24px 16px;
    background: var(--color-card);
    border: 1px dashed var(--color-border);
    border-radius: 16px;
    text-align: center;
  }

  .catalog-placeholder p {
    color: var(--color-text-secondary);
    font-size: var(--font-size-secondary);
    font-weight: var(--font-weight-regular);
  }

  .catalog-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px 16px;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    text-align: center;
  }

  .catalog-error p {
    color: var(--color-text-secondary);
    font-size: var(--font-size-secondary);
    font-weight: var(--font-weight-regular);
  }

  .retry-button {
    min-height: 44px;
    padding: 0 18px;
    color: var(--color-background);
    background: var(--color-accent);
    border: 0;
    border-radius: 12px;
    font: inherit;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }

  .retry-button:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  .catalog-enter-active,
  .catalog-leave-active {
    transition:
      opacity 180ms ease,
      transform 180ms ease;
  }

  @keyframes category-tab-shimmer {
    to {
      background-position: -200% 0;
    }
  }

  .catalog-enter-from,
  .catalog-leave-to {
    opacity: 0;
    transform: translateY(8px);
  }

  @media (min-width: 360px) {
    .catalog-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 640px) {
    .home-page {
      --home-page-inline-padding: 24px;
      padding: 16px 24px 24px;
    }

    .category-tabs {
      margin-right: -24px;
      padding-right: 24px;
    }

    .catalog-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .catalog-enter-active,
    .catalog-leave-active {
      transition: none;
    }

    .category-tab-skeleton {
      animation: none;
    }

    .category-tab-indicator {
      transition: none;
    }
  }
</style>

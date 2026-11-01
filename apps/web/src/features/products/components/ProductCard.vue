<script setup lang="ts">
  import { computed } from 'vue';

  import type { ProductCardEmits, ProductCardProps } from '../types';

  import { FireIcon, HeartIcon, PlusIcon, ServingIcon } from '@/shared/icons';
  import { formatPrice } from '@/shared/utils';

  const props = defineProps<ProductCardProps>();

  const emit = defineEmits<ProductCardEmits>();

  const price = computed(() => formatPrice(props.product.priceRub));

  function toggleFavorite() {
    emit('favorite', props.product);
  }
</script>

<template>
  <article class="product-card">
    <div class="product-image-wrapper">
      <img class="product-image" :src="product.imageUrl" :alt="product.name" loading="lazy" />

      <span v-if="product.badgeText" class="product-badge">
        <FireIcon class="product-badge-icon" />
        {{ product.badgeText }}
      </span>

      <button
        type="button"
        class="favorite-button"
        :class="{ 'favorite-button--active': isFavorite }"
        :aria-label="
          isFavorite
            ? `Удалить «${product.name}» из избранного`
            : `Добавить «${product.name}» в избранное`
        "
        :aria-pressed="isFavorite"
        @click="toggleFavorite"
      >
        <HeartIcon class="favorite-icon" />
      </button>
    </div>

    <div class="product-content">
      <div class="product-details">
        <h2 class="product-name">{{ product.name }}</h2>
        <p v-if="product.description" class="product-description">
          {{ product.description }}
        </p>

        <span v-if="product.servingLabel" class="product-meta">
          <ServingIcon class="product-meta-icon" />
          {{ product.servingLabel }}
        </span>
      </div>

      <div class="product-footer">
        <span class="product-price">{{ price }}</span>
        <button
          type="button"
          class="add-button"
          :aria-label="`Добавить «${product.name}» в корзину`"
          @click="emit('add', product)"
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
  .product-card {
    display: flex;
    height: 100%;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    padding: 16px;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-product-card);
    container-type: inline-size;
  }

  .product-image-wrapper {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: var(--radius-product-image);
    background: var(--color-surface);
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-badge {
    position: absolute;
    top: 16px;
    left: 16px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: var(--control-height-product-meta);
    padding: 0 14px;
    color: var(--color-accent);
    background: var(--color-surface-glass);
    border: 1px solid var(--color-accent);
    border-radius: 999px;
    font-size: var(--font-size-secondary);
    font-weight: var(--font-weight-semibold);
    line-height: 1;
  }

  .product-badge-icon {
    width: var(--icon-size-product-badge);
    height: var(--icon-size-product-badge);
    fill: currentcolor;
  }

  .favorite-button {
    position: absolute;
    top: 16px;
    right: 16px;
    display: grid;
    width: var(--control-size-product-favorite);
    height: var(--control-size-product-favorite);
    padding: 0;
    color: var(--color-text);
    background: var(--color-surface-glass);
    border: 1px solid var(--color-border);
    border-radius: 50%;
    cursor: pointer;
    place-items: center;
  }

  .favorite-button:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .favorite-button--active {
    color: var(--color-accent);
  }

  .favorite-button :deep(svg) {
    width: var(--icon-size-product-favorite);
    height: var(--icon-size-product-favorite);
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }

  .favorite-icon :deep(path) {
    fill: transparent;
    transition:
      fill 220ms ease,
      stroke 220ms ease;
  }

  .favorite-button--active .favorite-icon :deep(path) {
    fill: currentcolor;
    stroke: currentcolor;
  }

  .product-content,
  .product-details,
  .product-footer {
    display: flex;
  }

  .product-content,
  .product-details {
    min-width: 0;
    flex-direction: column;
  }

  .product-content {
    flex: 1;
    gap: 16px;
  }

  .product-details {
    flex: 1;
    gap: 10px;
  }

  .product-name {
    display: -webkit-box;
    min-height: 2.2em;
    overflow: hidden;
    font-size: var(--font-size-product-card-title);
    font-weight: var(--font-weight-bold);
    line-height: 1.1;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .product-description {
    display: -webkit-box;
    min-height: 2.7em;
    overflow: hidden;
    color: var(--color-text-secondary);
    font-size: var(--font-size-product-card-description);
    font-weight: var(--font-weight-regular);
    line-height: 1.35;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .product-meta {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    margin-top: auto;
    gap: 8px;
    min-height: var(--control-height-product-meta);
    padding: 0 14px;
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border-radius: 999px;
    font-size: var(--font-size-product-card-meta);
    font-weight: var(--font-weight-medium);
  }

  .product-meta-icon {
    width: var(--icon-size-product-meta);
    height: var(--icon-size-product-meta);
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }

  .product-footer {
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
  }

  .product-price {
    color: var(--color-text);
    font-size: var(--font-size-product-card-price);
    font-weight: var(--font-weight-bold);
    line-height: 1;
  }

  .add-button {
    display: grid;
    width: var(--control-size-product-add);
    height: var(--control-size-product-add);
    flex: 0 0 auto;
    padding: 0;
    color: var(--color-background);
    background: var(--color-accent);
    border: 0;
    border-radius: var(--radius-product-add);
    cursor: pointer;
    place-items: center;
  }

  .add-button:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }

  .add-button :deep(svg) {
    width: var(--icon-size-product-add);
    height: var(--icon-size-product-add);
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-width: 2;
  }

  @container (max-width: 240px) {
    .product-card {
      gap: 8px;
      padding: var(--spacing-product-card-compact);
      border-radius: var(--radius-product-card-compact);
    }

    .product-image-wrapper {
      border-radius: var(--radius-product-image-compact);
    }

    .product-badge {
      top: var(--spacing-product-card-compact);
      left: var(--spacing-product-card-compact);
      gap: 4px;
      min-height: 24px;
      padding: 0 8px;
      font-size: 10px;
    }

    .product-badge-icon {
      width: 12px;
      height: 12px;
    }

    .favorite-button {
      top: var(--spacing-product-card-compact);
      right: var(--spacing-product-card-compact);
      width: var(--control-size-product-favorite-compact);
      height: var(--control-size-product-favorite-compact);
    }

    .favorite-button :deep(svg) {
      width: var(--icon-size-product-favorite-compact);
      height: var(--icon-size-product-favorite-compact);
    }

    .product-content {
      gap: 8px;
    }

    .product-details {
      gap: 4px;
    }

    .product-name {
      font-size: var(--font-size-product-name);
    }

    .product-description {
      font-size: var(--font-size-product-card-description-compact);
    }

    .product-meta {
      gap: 4px;
      min-height: var(--control-height-product-meta-compact);
      padding: 0 8px;
      font-size: var(--font-size-product-card-meta-compact);
    }

    .product-meta-icon {
      width: 14px;
      height: 14px;
    }

    .product-footer {
      gap: 8px;
      padding-top: 8px;
    }

    .product-price {
      font-size: var(--font-size-price);
    }

    .add-button {
      width: var(--control-size-product-add-compact);
      height: var(--control-size-product-add-compact);
      border-radius: var(--radius-product-add-compact);
    }

    .add-button :deep(svg) {
      width: 20px;
      height: 20px;
    }
  }
</style>

<template>
  <div class="catalog-skeleton" aria-label="Каталог загружается" aria-busy="true">
    <div class="skeleton-tabs" aria-hidden="true">
      <span v-for="index in 4" :key="index" class="skeleton-tab" />
    </div>

    <div class="skeleton-grid" aria-hidden="true">
      <article v-for="index in 6" :key="index" class="skeleton-card">
        <span class="skeleton-image" />
        <span class="skeleton-line skeleton-line--title" />
        <span class="skeleton-line" />
        <span class="skeleton-line skeleton-line--short" />
      </article>
    </div>
  </div>
</template>

<style scoped>
  .catalog-skeleton,
  .skeleton-grid {
    display: grid;
  }
  .catalog-skeleton {
    gap: 32px;
  }

  .skeleton-tabs {
    display: flex;
    gap: 8px;
    overflow: hidden;
  }

  .skeleton-tab,
  .skeleton-image,
  .skeleton-line {
    display: block;
    background: linear-gradient(
      100deg,
      var(--color-surface) 30%,
      var(--color-card) 50%,
      var(--color-surface) 70%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }

  .skeleton-tab {
    width: 100px;
    height: var(--control-height-category);
    flex: 0 0 auto;
    border-radius: 10px;
  }

  .skeleton-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .skeleton-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-product-card);
  }
  .skeleton-image {
    aspect-ratio: 1;
    border-radius: var(--radius-product-image);
  }
  .skeleton-line {
    width: 100%;
    height: 14px;
    border-radius: 999px;
  }
  .skeleton-line--title {
    width: 72%;
    height: 20px;
  }
  .skeleton-line--short {
    width: 45%;
  }
  @keyframes shimmer {
    to {
      background-position: -200% 0;
    }
  }
  @media (min-width: 360px) {
    .skeleton-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 640px) {
    .skeleton-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .skeleton-tab,
    .skeleton-image,
    .skeleton-line {
      animation: none;
    }
  }
</style>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';

  import { NAVIGATION_ITEMS } from '@/shared/constants';

  const route = useRoute();

  const activeNavigationIndex = computed(() => {
    const index = NAVIGATION_ITEMS.findIndex((item) => item.to === route.path);

    return index === -1 ? 0 : index;
  });
</script>

<template>
  <nav
    class="bottom-navigation"
    :style="{
      '--active-navigation-index': activeNavigationIndex,
      '--navigation-item-count': NAVIGATION_ITEMS.length,
    }"
    aria-label="Основная навигация"
  >
    <span class="navigation-active-indicator" aria-hidden="true" />

    <RouterLink
      v-for="item in NAVIGATION_ITEMS"
      :key="item.to"
      :to="item.to"
      class="navigation-link"
    >
      <component
        :is="item.icon"
        class="navigation-icon"
        :class="{
          'navigation-icon--active': item.to === route.path,
          'navigation-icon--favorite': item.to === '/favorites',
        }"
      />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
  .bottom-navigation {
    position: fixed;
    z-index: 10;
    bottom: max(12px, env(safe-area-inset-bottom));
    left: 50%;
    display: grid;
    grid-template-columns: repeat(var(--navigation-item-count), minmax(0, 1fr));
    width: min(430px, calc(100% - 24px - env(safe-area-inset-left) - env(safe-area-inset-right)));
    overflow: hidden;
    transform: translateX(-50%);
    border: 1px solid var(--color-border);
    border-radius: 30px;
    background: var(--color-surface-glass);
    box-shadow: var(--shadow-navigation);
    backdrop-filter: blur(5px);
  }

  .navigation-active-indicator {
    position: absolute;
    top: 6px;
    left: 6px;
    z-index: 0;
    width: calc((100% - 12px) / var(--navigation-item-count));
    height: calc(100% - 12px);
    background: var(--color-navigation-active-surface);
    border: 1px solid var(--color-navigation-active-border);
    border-radius: 24px;
    box-shadow:
      inset 0 1px 0 var(--color-navigation-active-highlight),
      var(--shadow-navigation-active);
    -webkit-backdrop-filter: blur(32px) saturate(180%) brightness(125%);
    backdrop-filter: blur(32px) saturate(180%) brightness(125%);
    pointer-events: none;
    transform: translateX(calc(var(--active-navigation-index) * 100%));
    transition:
      transform 560ms cubic-bezier(0.34, 1.42, 0.64, 1),
      background-color 360ms ease,
      box-shadow 360ms ease;
  }

  .navigation-link {
    position: relative;
    z-index: 1;
    display: grid;
    min-height: var(--control-height-navigation);
    place-items: center;
    align-content: center;
    gap: 4px;
    padding: 8px 4px;
    color: var(--color-inactive);
    font-size: var(--font-size-navigation);
    font-weight: var(--font-weight-semibold);
    line-height: 1.1;
    text-align: center;
    text-decoration: none;
  }

  .navigation-link:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: -3px;
  }

  .navigation-link.router-link-exact-active {
    color: var(--color-accent);
  }

  .navigation-link.router-link-exact-active .navigation-icon--favorite {
    fill: currentColor;
  }

  .navigation-icon {
    width: var(--icon-size-navigation);
    height: var(--icon-size-navigation);
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.7;
  }

  .navigation-icon--active {
    animation: navigation-icon-jitter 360ms ease-out;
  }

  @keyframes navigation-icon-jitter {
    0% {
      transform: translateY(2px) rotate(-3deg);
    }

    30% {
      transform: translateY(-2px) rotate(2deg);
    }

    55% {
      transform: translateY(1px) rotate(-1deg);
    }

    100% {
      transform: translateY(0) rotate(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .navigation-active-indicator {
      transition: none;
    }

    .navigation-icon--active {
      animation: none;
    }
  }
</style>

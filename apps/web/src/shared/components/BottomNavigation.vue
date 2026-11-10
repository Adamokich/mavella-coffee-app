<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { useCartStore } from '@/features/cart';

  import { NAVIGATION_ITEMS } from '@/shared/constants';

  const route = useRoute();
  const cartStore = useCartStore();
  const isDropMoving = ref(false);

  const activeNavigationIndex = computed(() => {
    const index = NAVIGATION_ITEMS.findIndex((item) => item.to === route.path);

    return index === -1 ? 0 : index;
  });

  watch(activeNavigationIndex, async () => {
    isDropMoving.value = false;
    await nextTick();
    isDropMoving.value = true;
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
    <span
      class="navigation-active-indicator"
      :class="{ 'navigation-active-indicator--moving': isDropMoving }"
      aria-hidden="true"
    />

    <RouterLink
      v-for="item in NAVIGATION_ITEMS"
      :key="item.to"
      :to="item.to"
      class="navigation-link"
    >
      <span class="navigation-icon-wrap">
        <component
          :is="item.icon"
          class="navigation-icon"
          :class="{
            'navigation-icon--active': item.to === route.path,
            'navigation-icon--favorite': item.to === '/favorites',
          }"
        />
        <span
          v-if="item.to === '/cart' && cartStore.count"
          class="navigation-count"
          aria-hidden="true"
          >{{ cartStore.count }}</span
        >
      </span>
      <span
        >{{ item.label
        }}<span v-if="item.to === '/cart' && cartStore.count" class="visually-hidden"
          >: {{ cartStore.count }} товаров</span
        ></span
      >
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
    border-radius: 28px;
    background: var(--color-surface-glass);
    background:
      radial-gradient(ellipse at 50% 120%, var(--color-navigation-drop-glow), transparent 58%),
      linear-gradient(155deg, var(--color-navigation-glass-shine), transparent 38%),
      var(--color-navigation-glass);
    box-shadow:
      inset 0 1px 0 var(--color-navigation-glass-rim),
      inset 0 -1px 0 var(--color-navigation-active-highlight),
      var(--shadow-navigation);
    -webkit-backdrop-filter: blur(20px) saturate(150%);
    backdrop-filter: blur(20px) saturate(150%);
  }

  .bottom-navigation::before {
    position: absolute;
    inset: 1px;
    border: 1px solid var(--color-navigation-glass-shine);
    border-radius: inherit;
    content: '';
    pointer-events: none;
  }

  .navigation-active-indicator {
    position: absolute;
    top: 6px;
    left: 6px;
    z-index: 0;
    width: calc((100% - 12px) / var(--navigation-item-count));
    height: calc(100% - 12px);
    background:
      radial-gradient(ellipse at 50% 115%, var(--color-navigation-drop-glow), transparent 60%),
      linear-gradient(155deg, var(--color-navigation-glass-shine), transparent 42%),
      var(--color-navigation-drop);
    border: 1px solid var(--color-navigation-active-border);
    border-radius: 999px;
    box-shadow:
      inset 0 2px 2px var(--color-navigation-drop-shine),
      inset 0 -2px 4px var(--color-navigation-drop-glow),
      0 0 8px var(--color-navigation-drop-glow),
      var(--shadow-navigation-active);
    pointer-events: none;
    transform: translateX(calc(var(--active-navigation-index) * 100%));
    transition:
      transform 680ms cubic-bezier(0.22, 1, 0.36, 1),
      background-color 360ms ease,
      box-shadow 360ms ease;
  }

  .navigation-active-indicator::before {
    position: absolute;
    inset: 4px 8px 48%;
    border-radius: 999px 999px 50% 50%;
    background: linear-gradient(var(--color-navigation-glass-shine), transparent);
    content: '';
  }

  .navigation-active-indicator--moving {
    animation: navigation-drop-move 680ms ease-in-out;
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

  @media (hover: hover) {
    .navigation-link:hover {
      color: var(--color-text);
    }

    .navigation-link.router-link-exact-active:hover {
      color: var(--color-accent);
    }
  }

  .navigation-link.router-link-exact-active .navigation-icon--favorite {
    fill: currentColor;
  }

  .navigation-icon-wrap {
    position: relative;
    display: flex;
  }

  .navigation-count {
    position: absolute;
    top: -6px;
    left: 18px;
    min-width: 18px;
    padding: 1px 4px;
    color: var(--color-background);
    background: var(--color-accent);
    border-radius: 999px;
    font-size: 11px;
    line-height: 16px;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
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

  @keyframes navigation-drop-move {
    0%,
    100% {
      scale: 1 1;
      border-radius: 40px;
    }

    35% {
      scale: 1.04 0.96;
      border-radius: 35px 42px 42px 35px;
    }

    70% {
      scale: 0.99 1.01;
      border-radius: 42px 38px 38px 42px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .navigation-active-indicator {
      transition: none;
      animation: none;
    }

    .navigation-icon--active {
      animation: none;
    }
  }
</style>

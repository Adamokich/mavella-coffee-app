<script setup lang="ts">
  import { RouterView, useRoute } from 'vue-router';

  import { BottomNavigation } from '@/shared';

  const route = useRoute();
</script>

<template>
  <main class="app-shell" :class="{ 'app-shell--full-page': route.meta.hideBottomNavigation }">
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
    <BottomNavigation v-if="!route.meta.hideBottomNavigation" />
  </main>
</template>

<style>
  .app-shell.app-shell--full-page {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .page-enter-active,
  .page-leave-active {
    transition:
      opacity 180ms ease,
      transform 180ms ease;
  }

  .page-enter-from,
  .page-leave-to {
    opacity: 0;
    transform: translateY(8px);
  }

  @media (prefers-reduced-motion: reduce) {
    .page-enter-active,
    .page-leave-active {
      transition: none;
    }
  }
</style>

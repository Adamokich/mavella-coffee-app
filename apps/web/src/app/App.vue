<script setup lang="ts">
import { RouterView } from 'vue-router'

import { BottomNavigation } from '@/shared'
</script>

<template>
  <main class="app-shell">
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
    <BottomNavigation />
  </main>
</template>

<style>
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

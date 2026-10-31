<script setup lang="ts">
import { RouterView } from 'vue-router'

import { BottomNavigation } from '@/shared'
</script>

<template>
  <main class="app-shell">
    <RouterView />
    <BottomNavigation />
  </main>
</template>

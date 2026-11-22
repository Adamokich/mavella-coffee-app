<script setup lang="ts">
  defineProps<{
    name: 'back' | 'next' | 'bag' | 'copy' | 'history' | 'all' | 'clock' | 'done' | 'cancel';
  }>();
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path v-if="name === 'back'" d="m14 5-7 7 7 7" />
    <path v-else-if="name === 'next'" d="m9 5 7 7-7 7" />
    <path v-else-if="name === 'bag'" d="M5 8h14l1 13H4L5 8Zm4 2V6a3 3 0 0 1 6 0v4" />
    <template v-else-if="name === 'copy'">
      <rect x="4" y="7" width="12" height="14" rx="2" />
      <path d="M8 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2" />
    </template>
    <path
      v-else-if="name === 'history'"
      d="M10 19H5a2 2 0 0 1-2-2l.9-9A2 2 0 0 1 6 6h9a2 2 0 0 1 2 2v2M7 8V5a3.5 3.5 0 0 1 7 0v3M12 14a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v8l-2-1.5-2.5 1.5-2.5-1.5-2 1.5Zm3 1.5h3m-3 2.8h3"
    />
    <path v-else-if="name === 'all'" d="m3 7 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 17l9 5 9-5" />
    <template v-else>
      <circle cx="12" cy="12" r="10" />
      <path v-if="name === 'clock'" d="M12 6v6l3 2" />
      <path v-else-if="name === 'done'" d="m8 12 2.5 2.5L16 9" />
      <path v-else d="m8.5 8.5 7 7m0-7-7 7" />
    </template>
  </svg>
</template>

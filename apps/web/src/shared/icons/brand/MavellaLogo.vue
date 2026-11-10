<script setup lang="ts">
  defineProps<{ centered?: boolean }>();
</script>

<template>
  <svg viewBox="0 0 560 160" role="img" aria-label="Mavella" xmlns="http://www.w3.org/2000/svg">
    <text
      :x="centered ? 280 : 18"
      :text-anchor="centered ? 'middle' : 'start'"
      y="118"
      fill="currentColor"
      font-family="Segoe Script, Brush Script MT, cursive"
      font-size="110"
      font-style="italic"
      font-weight="700"
      letter-spacing="-10"
    >
      Mavella
    </text>
  </svg>
</template>

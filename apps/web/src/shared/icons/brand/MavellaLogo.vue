<script setup lang="ts">
  import { useId } from 'vue';
  import logoImage from '@/shared/assets/mavella-logo.jpg';

  const id = useId();
</script>

<template>
  <svg viewBox="420 85 450 135" role="img" aria-label="Mavella" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter :id="`${id}-filter`" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 1 1 0 -0.24" />
      </filter>
      <mask
        :id="`${id}-mask`"
        maskUnits="userSpaceOnUse"
        x="420"
        y="85"
        width="450"
        height="135"
        style="mask-type: alpha"
      >
        <image
          :href="logoImage"
          x="0"
          y="0"
          width="1280"
          height="298"
          :filter="`url(#${id}-filter)`"
        />
      </mask>
    </defs>
    <rect x="420" y="85" width="450" height="135" fill="currentColor" :mask="`url(#${id}-mask)`" />
  </svg>
</template>

<style scoped>
  svg {
    display: block;
    width: var(--width-brand-logo);
    max-width: 100%;
    height: auto;
  }
</style>

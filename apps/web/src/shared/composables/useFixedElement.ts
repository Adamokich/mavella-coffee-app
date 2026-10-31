import { onMounted, onUnmounted, ref } from 'vue';

export function useFixedElement(breakpointQuery: string) {
  const element = ref<HTMLElement | null>(null);
  const isFixed = ref(false);
  let mediaQuery: MediaQueryList | null = null;

  function updateFixedState() {
    isFixed.value = (element.value?.getBoundingClientRect().top ?? 0) <= 0;
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(breakpointQuery);
    updateFixedState();
    window.addEventListener('scroll', updateFixedState, { passive: true });
    mediaQuery.addEventListener('change', updateFixedState);
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', updateFixedState);
    mediaQuery?.removeEventListener('change', updateFixedState);
  });

  return {
    element,
    isFixed,
  };
}

import { onMounted, onUnmounted, ref } from 'vue';

export function useFixedElement() {
  const element = ref<HTMLElement | null>(null);
  const isFixed = ref(false);

  function updateFixedState() {
    isFixed.value = (element.value?.getBoundingClientRect().top ?? 0) <= 0;
  }

  onMounted(() => {
    updateFixedState();
    window.addEventListener('scroll', updateFixedState, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', updateFixedState);
  });

  return {
    element,
    isFixed,
  };
}

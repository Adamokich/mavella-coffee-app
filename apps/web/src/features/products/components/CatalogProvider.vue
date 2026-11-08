<script setup lang="ts">
  import { computed, onMounted } from 'vue';

  import ProductModifierModal from './ProductModifierModal.vue';
  import { useProductModifierModal } from '../composables/use-product-modifier-modal';
  import { useCatalogStore } from '../stores/catalog.store';
  import { useCartStore } from '@/features/cart';

  const catalogStore = useCatalogStore();
  const cartStore = useCartStore();
  const {
    closeModal,
    openModal,
    onToggleOption,
    modifierGroups,
    selectedProduct,
    totalRub,
    errorMessage,
    isLoading,
  } = useProductModifierModal();

  const selectedOptions = computed(() =>
    modifierGroups.value.flatMap((group) =>
      group.options
        .filter((option) => option.isSelected)
        .map(({ isSelected, ...option }) => option),
    ),
  );
  const maxQuantity = computed(() =>
    selectedProduct.value
      ? cartStore.remainingQuantity(selectedProduct.value, selectedOptions.value)
      : 0,
  );

  function addToCart(quantity: number) {
    if (!selectedProduct.value || quantity > maxQuantity.value) return;
    cartStore.addProduct(selectedProduct.value, selectedOptions.value, quantity);
    closeModal();
  }

  onMounted(() => {
    if (!catalogStore.categories.length && !catalogStore.isLoading) {
      void catalogStore.loadCatalog();
    }
  });
</script>

<template>
  <slot :open-modal="openModal" />

  <Teleport to="body">
    <Transition name="modifier-modal">
      <ProductModifierModal
        v-if="selectedProduct"
        :product="selectedProduct"
        :groups="modifierGroups"
        :total-rub="totalRub"
        :max-quantity="maxQuantity"
        :is-loading="isLoading"
        :error-message="errorMessage"
        @close="closeModal"
        @submit="addToCart"
        @retry="openModal(selectedProduct)"
        @toggle-option="onToggleOption"
      />
    </Transition>
  </Teleport>
</template>

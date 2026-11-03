<script setup lang="ts">
  import { onMounted } from 'vue';

  import ProductModifierModal from './ProductModifierModal.vue';
  import { useProductModifierModal } from '../composables/use-product-modifier-modal';
  import { useCatalogStore } from '../stores/catalog.store';

  const catalogStore = useCatalogStore();
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
        :is-loading="isLoading"
        :error-message="errorMessage"
        @close="closeModal"
        @retry="openModal(selectedProduct)"
        @toggle-option="onToggleOption"
      />
    </Transition>
  </Teleport>
</template>

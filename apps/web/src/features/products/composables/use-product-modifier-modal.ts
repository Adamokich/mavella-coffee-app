import { computed, ref } from 'vue';
import type { Product } from '@coffee-app/contracts';

import type { ModifierModalGroup } from '../types';
import { getProductModifiers } from '../api/productModifier';
import { isAxiosError } from 'axios';
import { modifierGroupFormat } from '../utils/modifier-group-format';
import { toggleOption } from '../utils/toggle-option';
import { calculateTotalPrice } from '../utils/calculate-total-price';

export function useProductModifierModal() {
  const selectedProduct = ref<Product | null>(null);
  const modifierGroups = ref<readonly ModifierModalGroup[]>([]);
  const isLoading = ref<boolean>(false);
  const errorMessage = ref<string | null>(null);

  const totalPriceDelta = computed(() => {
    return calculateTotalPrice(modifierGroups.value);
  });

  const totalRub = computed(() => {
    if (!selectedProduct.value) {
      return 0;
    }

    return selectedProduct.value.priceRub + totalPriceDelta.value;
  });

  function onToggleOption(groupId: number, optionId: number) {
    modifierGroups.value = toggleOption(modifierGroups.value, groupId, optionId);
  }

  async function openModal(product: Product) {
    selectedProduct.value = product;
    modifierGroups.value = [];
    errorMessage.value = null;
    isLoading.value = true;

    try {
      const data = await getProductModifiers(selectedProduct.value.id);
      modifierGroups.value = modifierGroupFormat(data);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        errorMessage.value = error.message;
      }
    } finally {
      isLoading.value = false;
    }
  }

  function closeModal() {
    selectedProduct.value = null;
    modifierGroups.value = [];
  }

  return {
    closeModal,
    modifierGroups,
    onToggleOption,
    openModal,
    selectedProduct,
    totalRub,
    isLoading,
    errorMessage,
  };
}

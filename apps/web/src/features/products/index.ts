export { default as ProductCard } from './components/ProductCard.vue';
export { default as ProductModifierModal } from './components/ProductModifierModal.vue';
export { default as CatalogSkeleton } from './components/CatalogSkeleton.vue';
export { useProductModifierModal } from './composables/use-product-modifier-modal';
export { useCatalogStore } from './stores/catalog.store';
export type {
  CatalogCategoryId,
  CatalogSection,
  ModifierModalGroup,
  ModifierModalOption,
  ModifierSelectionKind,
  ProductModifierModalEmits,
  ProductModifierModalProps,
} from './types';
export type {
  Category,
  Modifier,
  ModifierOption,
  Product,
  ProductModifier,
  ProductWithModifiers,
} from '@coffee-app/contracts';

import type { ModifierOption, Product } from '@coffee-app/contracts';

export type ModifierSelectionKind = 'single' | 'multiple';

export interface ModifierModalOption extends ModifierOption {
  isSelected?: boolean;
}

export interface ModifierModalGroup {
  id: number;
  name: string;
  selectionKind: ModifierSelectionKind;
  isRequired?: boolean;
  maxSelections?: number;
  minSelections?: number;
  options: readonly ModifierModalOption[];
}

export interface ProductModifierModalProps {
  product: Product;
  groups: readonly ModifierModalGroup[];
  totalRub: number;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export interface ProductModifierModalEmits {
  close: [];
  retry: [];
  submit: [];
  toggleOption: [groupId: number, optionId: number];
}

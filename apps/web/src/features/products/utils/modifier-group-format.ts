import { ProductWithModifiers } from '@coffee-app/contracts';
import { ModifierModalGroup } from '../types';

export const modifierGroupFormat = (
  productWithModifiers: ProductWithModifiers,
): ModifierModalGroup[] => {
  return productWithModifiers.modifiers.map((group) => ({
    id: group.modifierId,
    name: group.modifier.name,
    selectionKind: group.maxSelected > 1 ? 'multiple' : 'single',
    isRequired: group.minSelected > 0,
    maxSelections: group.maxSelected,
    minSelections: group.minSelected,
    options: group.modifier.modifierOptions.map((option) => ({
      ...option,
      isSelected: option.id === group.defaultOption?.id,
    })),
  }));
};

import { ModifierModalGroup } from '../types';

export const calculateTotalPrice = (modifierGroups: readonly ModifierModalGroup[]): number => {
  return modifierGroups
    .flatMap((group) => group.options)
    .reduce((acc, option) => {
      if (option.isSelected) {
        return acc + option.priceDelta;
      }

      return acc;
    }, 0);
};

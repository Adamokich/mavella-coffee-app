import { ModifierModalGroup } from '../types';

export const calculateTotalPrice = (modifierGroups: readonly ModifierModalGroup[]): number => {
  return modifierGroups
    .flatMap((group) => group.options)
    .reduce((acc, option) => {
      if (option.isSelected) {
        return acc + option.priceDeltaRub;
      }

      return acc;
    }, 0);
};

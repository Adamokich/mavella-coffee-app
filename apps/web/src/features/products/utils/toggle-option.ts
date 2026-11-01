import { ModifierModalGroup } from '../types';

export const toggleOption = (
  modifierGroups: readonly ModifierModalGroup[],
  groupId: number,
  optionId: number,
): ModifierModalGroup[] => {
  return modifierGroups.map((group) => {
    if (group.id !== groupId) return group;

    const targetOption = group.options.find((option) => option.id === optionId);

    if (!targetOption) return group;

    const selectedCount = group.options.filter((option) => option.isSelected).length;
    const minSelections = group.minSelections ?? 0;
    const maxSelections = group.maxSelections ?? Infinity;

    if (group.selectionKind === 'single') {
      if (targetOption.isSelected && selectedCount <= minSelections) {
        return group;
      }

      return {
        ...group,
        options: group.options.map((option) => ({
          ...option,
          isSelected: option.id === optionId ? !targetOption.isSelected : false,
        })),
      };
    }

    if (targetOption.isSelected && selectedCount <= minSelections) {
      return group;
    }

    if (!targetOption.isSelected && selectedCount >= maxSelections) {
      return group;
    }

    return {
      ...group,
      options: group.options.map((option) => {
        return option.id === optionId ? { ...option, isSelected: !option.isSelected } : option;
      }),
    };
  });
};

<script setup lang="ts">
  import { computed } from 'vue';

  import type {
    ModifierModalGroup,
    ProductModifierModalEmits,
    ProductModifierModalProps,
    ModifierModalOption,
  } from '../types';

  import {
    AdditionsIcon,
    BasketIcon,
    CheckIcon,
    CloseIcon,
    DropIcon,
    MilkIcon,
    ModifierCupIcon,
  } from '@/shared/icons';
  import { formatPrice } from '@/shared/utils';

  const props = defineProps<ProductModifierModalProps>();
  const emit = defineEmits<ProductModifierModalEmits>();

  const formattedTotal = computed(() => formatPrice(props.totalRub));

  function getGroupIcon(group: ModifierModalGroup) {
    const groupName = group.name.toLocaleLowerCase('ru-RU');

    if (groupName.includes('объём')) return ModifierCupIcon;
    if (groupName.includes('молоко')) return MilkIcon;
    if (groupName.includes('слад')) return DropIcon;

    return AdditionsIcon;
  }

  function getOptionPrice(option: ModifierModalOption) {
    return option.priceDelta > 0 ? `+${formatPrice(option.priceDelta)}` : '';
  }

  function getGroupHint(group: ModifierModalGroup) {
    if (group.isRequired) return 'Обязательно';
    if (group.maxSelections) return `До ${group.maxSelections} вариантов`;

    return '';
  }
</script>

<template>
  <div class="modifier-modal" role="presentation">
    <button
      type="button"
      class="modifier-modal__backdrop"
      aria-label="Закрыть окно настройки товара"
      @click="emit('close')"
    />

    <section
      class="modifier-modal__sheet"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`modifier-modal-title-${product.id}`"
    >
      <div class="modifier-modal__handle" aria-hidden="true" />

      <header class="modifier-modal__header">
        <img class="modifier-modal__image" :src="product.imageUrl" :alt="product.name" />

        <div class="modifier-modal__product-info">
          <h2 :id="`modifier-modal-title-${product.id}`">{{ product.name }}</h2>
          <p v-if="product.description">{{ product.description }}</p>
          <strong>{{ formatPrice(product.priceRub) }}</strong>
        </div>

        <button
          type="button"
          class="modifier-modal__close"
          aria-label="Закрыть"
          @click="emit('close')"
        >
          <CloseIcon />
        </button>
      </header>

      <div class="modifier-modal__content">
        <div v-if="isLoading" class="modifier-modal__skeleton" aria-busy="true" aria-live="polite">
          <span class="visually-hidden">Загружаем настройки товара</span>

          <section
            v-for="index in 3"
            :key="index"
            class="modifier-skeleton-group"
            aria-hidden="true"
          >
            <span class="modifier-skeleton modifier-skeleton--heading" />
            <div class="modifier-skeleton-group__options">
              <span
                v-for="optionIndex in index === 1 ? 3 : 2"
                :key="optionIndex"
                class="modifier-skeleton"
              />
            </div>
          </section>
        </div>

        <section v-else-if="errorMessage" class="modifier-modal__error" role="alert">
          <h3>Не удалось загрузить настройки</h3>
          <p>{{ errorMessage }}</p>
          <button type="button" @click="emit('retry')">Повторить</button>
        </section>

        <template v-else>
          <section
            v-for="group in groups"
            :key="group.id"
            class="modifier-group"
            :aria-labelledby="`modifier-group-${group.id}`"
          >
            <div class="modifier-group__heading">
              <component :is="getGroupIcon(group)" class="modifier-group__icon" />
              <h3 :id="`modifier-group-${group.id}`">{{ group.name }}</h3>
              <span v-if="getGroupHint(group)" class="modifier-group__hint">
                {{ getGroupHint(group) }}
              </span>
            </div>

            <div
              class="modifier-group__options"
              :class="[
                `modifier-group__options--${group.selectionKind}`,
                { 'modifier-group__options--tiles': group.options.length <= 3 },
              ]"
            >
              <button
                v-for="option in group.options"
                :key="option.id"
                type="button"
                class="modifier-option"
                :class="{ 'modifier-option--selected': option.isSelected }"
                :aria-pressed="option.isSelected ?? false"
                @click="emit('toggleOption', group.id, option.id)"
              >
                <span class="modifier-option__name">{{ option.name }}</span>
                <span v-if="getOptionPrice(option)" class="modifier-option__price">
                  {{ getOptionPrice(option) }}
                </span>
                <span class="modifier-option__control" aria-hidden="true">
                  <CheckIcon v-if="option.isSelected" />
                </span>
              </button>
            </div>
          </section>
        </template>
      </div>

      <footer class="modifier-modal__footer">
        <div class="modifier-modal__total">
          <span>Итого</span>
          <strong>{{ formattedTotal }}</strong>
        </div>

        <button
          type="button"
          class="modifier-modal__submit"
          :disabled="isLoading || Boolean(errorMessage)"
          @click="emit('submit')"
        >
          <BasketIcon />
          <span>Добавить в заказ</span>
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
  .modifier-modal {
    position: fixed;
    z-index: 100;
    inset: 0;
    display: flex;
    justify-content: center;
    background: var(--color-modal-scrim);
  }

  .modifier-modal__backdrop {
    position: absolute;
    inset: 0;
    padding: 0;
    background: transparent;
    border: 0;
    cursor: pointer;
  }

  .modifier-modal__sheet {
    position: relative;
    z-index: 1;
    display: flex;
    width: min(100%, 520px);
    max-height: min(90dvh, 820px);
    align-self: flex-end;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-bottom: 0;
    border-radius: var(--radius-modal);
    box-shadow: 0 -16px 48px var(--color-modal-scrim);
    will-change: transform;
  }

  .modifier-modal__handle {
    width: 38px;
    height: 4px;
    flex: 0 0 auto;
    margin: 12px auto 0;
    background: var(--color-text-secondary);
    border-radius: 999px;
    opacity: 0.8;
  }

  .modifier-modal__header {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr) var(--control-size-modal-close);
    gap: 12px;
    align-items: start;
    padding: 18px 16px 16px;
  }

  .modifier-modal__image {
    width: 96px;
    height: 96px;
    object-fit: cover;
    border-radius: var(--radius-modal-image);
  }

  .modifier-modal__product-info {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 5px;
    padding-top: 3px;
  }

  .modifier-modal__product-info h2 {
    font-size: var(--font-size-section-heading);
    line-height: 1.1;
  }

  .modifier-modal__product-info p {
    display: -webkit-box;
    overflow: hidden;
    color: var(--color-text-secondary);
    font-size: var(--font-size-secondary);
    font-weight: var(--font-weight-regular);
    line-height: 1.25;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .modifier-modal__product-info strong {
    margin-top: auto;
    font-size: var(--font-size-price);
    line-height: 1.2;
  }

  .modifier-modal__close {
    display: grid;
    width: var(--control-size-modal-close);
    height: var(--control-size-modal-close);
    padding: 0;
    color: var(--color-text-secondary);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 50%;
    cursor: pointer;
    place-items: center;
  }

  .modifier-modal__close svg,
  .modifier-modal__submit svg {
    width: var(--icon-size-modal);
    height: var(--icon-size-modal);
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }

  .modifier-modal__content {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    gap: 20px;
    padding: 0 16px 20px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .modifier-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .modifier-modal__skeleton {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .modifier-skeleton-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .modifier-skeleton-group__options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .modifier-skeleton {
    min-height: 62px;
    background: linear-gradient(
      100deg,
      var(--color-card) 30%,
      var(--color-modal-choice) 50%,
      var(--color-card) 70%
    );
    background-size: 200% 100%;
    border-radius: var(--radius-modal-option);
    animation: modifier-skeleton-shimmer 1.4s ease-in-out infinite;
  }

  .modifier-skeleton--heading {
    width: 42%;
    min-height: 20px;
    border-radius: 6px;
  }

  .modifier-modal__error {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 220px;
    padding: 24px 16px;
    background: var(--color-card);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-modal-option);
    text-align: center;
  }

  .modifier-modal__error h3 {
    margin: 0;
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-semibold);
  }

  .modifier-modal__error p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-secondary);
    font-weight: var(--font-weight-regular);
  }

  .modifier-modal__error button {
    min-height: 44px;
    padding: 0 18px;
    color: var(--color-background);
    background: var(--color-accent);
    border: 0;
    border-radius: var(--radius-modal-option);
    cursor: pointer;
    font: inherit;
    font-weight: var(--font-weight-semibold);
  }

  .modifier-group__heading {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .modifier-group__icon {
    width: var(--icon-size-modal);
    height: var(--icon-size-modal);
    flex: 0 0 auto;
    fill: none;
    stroke: var(--color-text);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.6;
  }

  .modifier-group__heading h3 {
    min-width: 0;
    margin: 0;
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-semibold);
    line-height: 1.25;
  }

  .modifier-group__hint {
    margin-left: auto;
    padding: 3px 8px;
    color: var(--color-accent);
    background: var(--color-modal-choice);
    border-radius: 999px;
    font-size: 11px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.2;
    white-space: nowrap;
  }

  .modifier-group__options {
    display: grid;
    gap: 8px;
  }

  .modifier-group__options--tiles {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .modifier-option {
    display: grid;
    min-width: 0;
    min-height: 48px;
    grid-template-columns: minmax(0, 1fr) auto 20px;
    gap: 8px;
    align-items: center;
    padding: 10px 12px;
    color: var(--color-text);
    background: var(--color-modal-choice);
    border: 1px solid transparent;
    border-radius: var(--radius-modal-option);
    cursor: pointer;
    font: inherit;
    font-size: var(--font-size-secondary);
    text-align: left;
  }

  .modifier-group__options--tiles .modifier-option {
    min-height: 62px;
    grid-template-columns: minmax(0, 1fr) 18px;
    align-content: center;
  }

  .modifier-group__options--tiles .modifier-option__price {
    grid-column: 1;
  }

  .modifier-option--selected {
    background: var(--color-modal-choice-selected);
    border-color: var(--color-accent);
  }

  .modifier-option__name {
    overflow: hidden;
    font-weight: var(--font-weight-medium);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .modifier-option__price {
    color: var(--color-accent);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
  }

  .modifier-option__control {
    display: grid;
    width: 20px;
    height: 20px;
    border: 1px solid var(--color-text-secondary);
    border-radius: 6px;
    place-items: center;
  }

  .modifier-group__options--single .modifier-option__control {
    border-radius: 50%;
  }

  .modifier-option--selected .modifier-option__control {
    color: var(--color-background);
    background: var(--color-accent);
    border-color: var(--color-accent);
  }

  .modifier-option__control svg {
    width: 15px;
    height: 15px;
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2.5;
  }

  .modifier-modal__footer {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 14px;
    align-items: center;
    padding: 14px 16px calc(16px + env(safe-area-inset-bottom));
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
  }

  .modifier-modal__total {
    display: flex;
    min-width: 76px;
    flex-direction: column;
    gap: 2px;
  }

  .modifier-modal__total span {
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: var(--font-weight-regular);
  }

  .modifier-modal__total strong {
    font-size: var(--font-size-price);
    line-height: 1.1;
  }

  .modifier-modal__submit {
    display: inline-flex;
    min-width: 0;
    min-height: var(--control-height-modal-submit);
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 14px;
    color: var(--color-background);
    background: var(--color-accent);
    border: 0;
    border-radius: 16px;
    cursor: pointer;
    font: inherit;
    font-size: var(--font-size-secondary);
    font-weight: var(--font-weight-bold);
    white-space: nowrap;
  }

  .modifier-modal__submit:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .modifier-modal__backdrop:focus-visible,
  .modifier-modal__close:focus-visible,
  .modifier-option:focus-visible,
  .modifier-modal__error button:focus-visible,
  .modifier-modal__submit:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }

  .modifier-modal-enter-active,
  .modifier-modal-leave-active {
    transition: opacity 240ms ease;
  }

  .modifier-modal-enter-active .modifier-modal__sheet,
  .modifier-modal-leave-active .modifier-modal__sheet {
    transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .modifier-modal-enter-from,
  .modifier-modal-leave-to {
    opacity: 0;
  }

  .modifier-modal-enter-from .modifier-modal__sheet,
  .modifier-modal-leave-to .modifier-modal__sheet {
    transform: translateY(100%);
  }

  @keyframes modifier-skeleton-shimmer {
    to {
      background-position: -200% 0;
    }
  }

  @media (min-width: 640px) {
    .modifier-modal__sheet {
      align-self: center;
      border-bottom: 1px solid var(--color-border);
      border-radius: 28px;
    }
  }

  @media (max-width: 359px) {
    .modifier-modal__header {
      grid-template-columns: 76px minmax(0, 1fr) 32px;
    }

    .modifier-modal__image {
      width: 76px;
      height: 76px;
    }

    .modifier-modal__close {
      width: 32px;
      height: 32px;
    }

    .modifier-modal__footer {
      gap: 8px;
      padding-inline: 12px;
    }

    .modifier-modal__submit {
      padding-inline: 10px;
      font-size: 12px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .modifier-modal-enter-active,
    .modifier-modal-leave-active,
    .modifier-modal-enter-active .modifier-modal__sheet,
    .modifier-modal-leave-active .modifier-modal__sheet {
      transition: none;
    }

    .modifier-skeleton {
      animation: none;
    }
  }
</style>

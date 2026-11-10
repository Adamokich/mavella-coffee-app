<script setup lang="ts">
  import { onMounted } from 'vue';
  import { getCartItemTotal, useCartStore, type CartItem } from '@/features/cart';
  import { useCatalogStore } from '@/features/products';
  import { MavellaLogo } from '@/shared/icons';
  import { formatPrice } from '@/shared/utils';

  const cart = useCartStore();
  const catalog = useCatalogStore();

  function itemKey(item: CartItem) {
    return `${item.product.id}:${
      item.options === null
        ? 'legacy'
        : item.options
            .map((option) => option.id)
            .sort((a, b) => a - b)
            .join(',')
    }`;
  }

  onMounted(async () => {
    const productIds = new Set(
      cart.items
        .filter((item) => item.options?.some((option) => !Number.isFinite(option.priceDeltaRub)))
        .map((item) => item.product.id),
    );
    await Promise.allSettled(
      [...productIds].map(async (id) => {
        const product = await catalog.loadProductModifiers(id);
        cart.restoreOptionPrices(
          id,
          product.modifiers.flatMap((group) => group.modifier.modifierOptions),
        );
      }),
    );
  });
</script>

<template>
  <section class="order-page" aria-labelledby="order-title">
    <MavellaLogo class="order-logo" centered />
    <header class="order-header">
      <h1 id="order-title">Мой заказ</h1>
      <button v-if="cart.items.length" class="clear-button" type="button" @click="cart.clear">
        Очистить
      </button>
    </header>

    <div class="order-items">
      <TransitionGroup name="order-item" tag="div" class="order-item-list">
        <article v-for="item in cart.items" :key="itemKey(item)" class="order-item">
          <img :src="item.product.imageUrl" :alt="item.product.name" class="order-image" />
          <div class="order-details">
            <div class="order-item-heading">
              <h2>{{ item.product.name }}</h2>
              <strong>{{
                getCartItemTotal(item) === null
                  ? 'Цена недоступна'
                  : formatPrice(getCartItemTotal(item)!)
              }}</strong>
            </div>
            <p v-if="item.product.servingLabel" class="order-serving">
              {{ item.product.servingLabel }}
            </p>
            <ul v-if="item.options?.length" class="order-options">
              <li v-for="option in item.options" :key="option.id">
                {{ option.name }}
                <span v-if="option.priceDeltaRub"
                  >{{ option.priceDeltaRub > 0 ? '+' : ''
                  }}{{ formatPrice(option.priceDeltaRub) }}</span
                >
              </li>
            </ul>
            <p v-if="item.options === null" class="order-warning">
              Настройки этого товара не сохранены. Удалите его и добавьте заново.
            </p>
            <div class="quantity" :aria-label="`Количество: ${item.product.name}`">
              <button
                type="button"
                :aria-label="`Уменьшить количество ${item.product.name}`"
                @click="cart.changeQuantity(item, -1)"
              >
                −
              </button>
              <span>{{ item.quantity }}</span>
              <button
                type="button"
                :disabled="item.quantity >= 20"
                :aria-label="`Увеличить количество ${item.product.name}`"
                @click="cart.changeQuantity(item, 1)"
              >
                +
              </button>
            </div>
          </div>
        </article>
      </TransitionGroup>
      <div v-if="cart.items.length" class="order-total">
        <span>Итого</span
        ><Transition name="order-price" mode="out-in"
          ><strong :key="cart.total ?? 'unavailable'">{{
            cart.total === null ? 'Цена недоступна' : formatPrice(cart.total)
          }}</strong></Transition
        >
      </div>
      <RouterLink v-if="cart.items.length" class="checkout-button" to="/checkout">
        Оформить заказ
      </RouterLink>
    </div>
    <div v-if="!cart.items.length" class="order-empty">
      <p>В вашем заказе пока ничего нет.</p>
      <RouterLink to="/">Перейти в каталог</RouterLink>
    </div>
  </section>
</template>

<style scoped>
  .order-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px 16px 24px;
  }
  .order-logo {
    width: min(230px, 100%);
    height: auto;
    align-self: center;
    color: var(--color-accent);
  }
  .order-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .clear-button {
    min-height: 40px;
    padding: 0 14px;
    color: var(--color-text-secondary);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    font: inherit;
    cursor: pointer;
  }
  .order-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .order-item-list {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .order-item-move,
  .order-item-enter-active,
  .order-item-leave-active {
    transition:
      opacity 240ms ease,
      transform 240ms ease;
  }

  .order-item-enter-from,
  .order-item-leave-to {
    opacity: 0;
    transform: translateX(24px);
  }

  .order-item-leave-active {
    position: absolute;
    width: 100%;
    pointer-events: none;
  }

  .order-price-enter-active,
  .order-price-leave-active {
    transition:
      opacity 120ms ease,
      transform 120ms ease;
  }

  .order-price-enter-from {
    opacity: 0;
    transform: translateY(4px);
  }

  .order-price-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
  .order-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-product-card-compact);
  }
  .order-image {
    width: 76px;
    height: 76px;
    flex: 0 0 auto;
    object-fit: cover;
    border-radius: var(--radius-product-image-compact);
  }
  .order-details {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 6px;
  }
  .order-item-heading {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .order-item-heading h2 {
    font-size: var(--font-size-body);
    overflow-wrap: anywhere;
  }
  .order-item-heading strong {
    flex-shrink: 0;
    font-size: var(--font-size-body);
  }
  .order-serving,
  .order-warning {
    color: var(--color-text-secondary);
    font-size: var(--font-size-secondary);
  }
  .order-options {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .order-options li {
    padding: 3px 8px;
    background: var(--color-modal-choice);
    border-radius: 999px;
    font-size: 12px;
  }
  .quantity {
    display: flex;
    align-self: flex-end;
    align-items: center;
    background: var(--color-background);
    border-radius: 10px;
  }
  .quantity button {
    width: 36px;
    height: 36px;
    color: var(--color-accent);
    background: var(--color-modal-choice);
    border: 0;
    border-radius: 10px;
    font: inherit;
    font-size: 22px;
    cursor: pointer;
  }
  .quantity button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .quantity span {
    min-width: 36px;
    text-align: center;
  }
  .order-total {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 8px;
    border-top: 1px solid var(--color-border);
  }
  .order-total strong {
    font-size: var(--font-size-price);
  }

  .checkout-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 52px;
    padding: 0 16px;
    color: var(--color-background);
    background: var(--color-accent);
    border: 0;
    border-radius: 999px;
    font: inherit;
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
  }
  .order-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px;
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-product-card-compact);
    text-align: center;
  }
  .order-empty a {
    color: var(--color-accent);
  }
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  @media (min-width: 640px) {
    .order-page {
      max-width: 640px;
      margin-inline: auto;
      padding-inline: 24px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .order-item-move,
    .order-item-enter-active,
    .order-item-leave-active,
    .order-price-enter-active,
    .order-price-leave-active {
      transition: none;
    }
  }
</style>

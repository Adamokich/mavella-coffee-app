<script setup lang="ts">
  import { computed } from 'vue';
  import { useCheckoutStore } from '@/features/checkout';
  import { MavellaLogo } from '@/shared/icons';
  import { formatPrice } from '@/shared/utils';

  const checkout = useCheckoutStore();
  const statusText = computed(() => {
    switch (checkout.confirmation?.status) {
      case 'PENDING':
        return 'Заказ отправлен и ожидает подтверждения кофейни.';
      case 'READY':
        return 'Заказ готов к выдаче.';
      case 'COMPLETED':
        return 'Заказ выполнен.';
      case 'CANCELLED':
        return 'Заказ отменён.';
      default:
        return '';
    }
  });
</script>

<template>
  <section class="status-page">
    <MavellaLogo class="logo" centered />
    <template v-if="checkout.confirmation">
      <div class="status-icon" aria-hidden="true">✓</div>
      <h1>Заказ отправлен!</h1>
      <p class="status-message">{{ statusText }}</p>
      <dl class="order-info">
        <div>
          <dt>Номер заказа</dt>
          <dd>№{{ checkout.confirmation.id }}</dd>
        </div>
        <div>
          <dt>Способ получения</dt>
          <dd>Самовывоз</dd>
        </div>
        <div>
          <dt>Итого</dt>
          <dd>{{ formatPrice(checkout.confirmation.totalPriceRub) }}</dd>
        </div>
      </dl>
    </template>
    <template v-else>
      <h1>Данные заказа недоступны</h1>
      <p class="status-message">Данные подтверждения сохраняются до обновления приложения.</p>
    </template>
    <RouterLink class="home-link" to="/">Вернуться на главную</RouterLink>
  </section>
</template>

<style scoped>
  .status-page {
    display: flex;
    max-width: 480px;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin-inline: auto;
    padding: 16px 16px 24px;
    text-align: center;
  }
  .logo {
    width: min(230px, 70%);
    color: var(--color-accent);
  }
  .status-icon {
    display: grid;
    width: 84px;
    height: 84px;
    place-items: center;
    color: var(--color-background);
    background: var(--color-accent);
    border-radius: 50%;
    font-size: 42px;
  }
  .status-message {
    color: var(--color-text-secondary);
  }
  .order-info {
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    text-align: left;
  }
  .order-info div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .order-info dd {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    text-align: right;
  }
  .home-link {
    display: grid;
    width: 100%;
    min-height: 52px;
    place-items: center;
    padding: 0 16px;
    color: var(--color-background);
    background: var(--color-accent);
    border-radius: 999px;
    font-weight: var(--font-weight-bold);
    text-decoration: none;
  }
  .home-link:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }
</style>

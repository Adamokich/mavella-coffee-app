<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import {
    CheckIcon,
    CloseIcon,
    CoffeeIcon,
    MavellaLogo,
    OrderStatusIcon,
    PendingOrderIcon,
  } from '@/shared/icons';
  import { useCheckoutStore, useOrderTracking } from '@/features/checkout';
  import { formatPrice } from '@/shared/utils';

  const ORDER_STEPS = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'] as const;
  const CANCELLED_ORDER_STEPS = ['PENDING', 'CANCELLED'] as const;

  const STATUS_DETAILS = {
    PENDING: {
      label: 'Оформлен',
      icon: PendingOrderIcon,
      title: 'Заказ оформлен',
      description: 'Заказ отправлен и ожидает подтверждения кофейни.',
    },
    PREPARING: {
      label: 'Готовится',
      icon: CoffeeIcon,
      title: 'Ваш заказ готовится',
      description: 'Кофейня приняла заказ и начала приготовление.',
    },
    READY: {
      label: 'Готов к выдаче',
      icon: OrderStatusIcon,
      title: 'Ваш заказ готов к выдаче',
      description: 'Назовите номер заказа на стойке выдачи.',
    },
    COMPLETED: {
      label: 'Выполнен',
      icon: CheckIcon,
      title: 'Заказ выполнен',
      description: 'Спасибо, что выбрали Mavella!',
    },
    CANCELLED: {
      label: 'Отменён',
      icon: CloseIcon,
      title: 'Заказ отменён',
      description: 'Кофейня отменила заказ.',
    },
  };

  const checkout = useCheckoutStore();
  const route = useRoute();
  const orderId = route.params.orderId;
  const order = computed(() =>
    orderId
      ? (checkout.orderHistory.find((entry) => entry.id === Number(orderId)) ?? null)
      : checkout.confirmation,
  );
  const { trackingState } = useOrderTracking(() => order.value);
  const orderItems = computed(() => order.value?.summary ?? []);
  const status = computed(() => order.value && STATUS_DETAILS[order.value.status]);
  const steps = computed(() =>
    order.value?.status === 'CANCELLED' ? CANCELLED_ORDER_STEPS : ORDER_STEPS,
  );
  const currentStepIndex = computed(() =>
    steps.value.findIndex((step) => step === order.value?.status),
  );
  const copyFeedback = ref('');
  const pluralRules = new Intl.PluralRules('ru-RU');
  const positions = { one: 'позиция', few: 'позиции', many: 'позиций' } as const;

  const itemCount = computed(() => {
    const count = orderItems.value.length;
    const word = pluralRules.select(count);
    return count + ' ' + (word === 'one' || word === 'few' ? positions[word] : positions.many);
  });

  const submittedTime = computed(() => {
    const submittedAt = order.value?.submittedAt;
    if (typeof submittedAt !== 'number' || !Number.isFinite(submittedAt)) return null;

    const date = new Date(submittedAt);
    const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const day =
      date.toDateString() === new Date().toDateString()
        ? 'Сегодня'
        : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return { iso: date.toISOString(), label: day + ', ' + time };
  });

  watch(
    () => order.value?.id,
    () => {
      copyFeedback.value = '';
    },
  );

  async function copyOrderNumber() {
    if (!order.value) return;

    copyFeedback.value = '';
    try {
      await navigator.clipboard.writeText(String(order.value.id));
      copyFeedback.value = 'Номер скопирован';
    } catch {
      copyFeedback.value = 'Не удалось скопировать номер';
    }
  }

  function hideBrokenImage(event: Event) {
    if (event.target instanceof HTMLImageElement) event.target.hidden = true;
  }
</script>

<template>
  <section class="status-page">
    <header class="status-header">
      <div class="status-brand">
        <RouterLink
          class="back-button"
          :to="route.params.orderId ? { name: 'order-history' } : { name: 'catalog' }"
          :aria-label="route.params.orderId ? 'Вернуться к заказам' : 'Вернуться в каталог'"
        >
          <OrderStatusIcon name="back" class="icon" />
        </RouterLink>
        <MavellaLogo class="logo" />
      </div>
      <h1 class="status-heading">Статус заказа</h1>
    </header>

    <template v-if="order && status">
      <ol
        class="status-steps glass-panel"
        :style="{ '--step-index': currentStepIndex, '--step-count': steps.length }"
        aria-label="Этапы заказа"
      >
        <li
          v-for="(step, index) in steps"
          :key="step"
          class="status-step"
          :class="{
            'status-step--done': index < currentStepIndex,
            'status-step--current': index === currentStepIndex,
          }"
          :aria-current="index === currentStepIndex ? 'step' : undefined"
        >
          <div class="step-content">
            <span class="step-icon">
              <component
                :is="index < currentStepIndex ? CheckIcon : STATUS_DETAILS[step].icon"
                name="bag"
                class="icon"
              />
            </span>
            <span class="step-label">{{ STATUS_DETAILS[step].label }}</span>
            <span v-if="index < currentStepIndex" class="visually-hidden"> — пройдено</span>
          </div>
        </li>
      </ol>

      <div class="status-card glass-panel" role="status">
        <span class="status-card-icon">
          <Transition name="status-message">
            <component :is="status.icon" :key="order.status" name="bag" class="icon" />
          </Transition>
        </span>
        <Transition name="status-message">
          <div :key="order.status" class="status-card-copy">
            <h2>{{ status.title }}</h2>
            <p>{{ status.description }}</p>
            <p v-if="trackingState === 'recovering'">Восстанавливаем связь</p>
            <p v-else-if="trackingState === 'unavailable'">Не удалось получить статус заказа</p>
          </div>
        </Transition>
      </div>

      <dl class="order-meta">
        <div>
          <dt>Номер заказа</dt>
          <dd>
            <span>#{{ order.id }}</span>
            <button
              type="button"
              class="copy-button"
              aria-label="Скопировать номер заказа"
              @click="copyOrderNumber"
            >
              <CheckIcon v-if="copyFeedback === 'Номер скопирован'" class="icon" />
              <OrderStatusIcon v-else name="copy" class="icon" />
            </button>
            <span class="visually-hidden" role="status">{{ copyFeedback }}</span>
          </dd>
        </div>
        <div v-if="submittedTime">
          <dt>Время оформления</dt>
          <dd>
            <time :datetime="submittedTime.iso">{{ submittedTime.label }}</time>
          </dd>
        </div>
      </dl>

      <section class="order-items glass-panel" aria-labelledby="order-items-title">
        <div class="items-heading">
          <h2 id="order-items-title">Состав заказа</h2>
          <span v-if="orderItems.length">{{ itemCount }}</span>
        </div>
        <ul v-if="orderItems.length" class="item-list">
          <li v-for="(item, index) in orderItems" :key="index" class="order-item">
            <span class="item-thumbnail">
              <OrderStatusIcon name="bag" class="icon" />
              <img v-if="item.imageUrl" :src="item.imageUrl" alt="" @error="hideBrokenImage" />
            </span>
            <div class="item-copy">
              <p>{{ item.name }}</p>
              <p v-if="item.options.length" class="item-options">{{ item.options.join(' · ') }}</p>
            </div>
            <span v-if="item.total !== null" class="item-price">
              {{ item.quantity }} × {{ formatPrice(item.total / item.quantity) }}
            </span>
            <span v-else class="item-price">{{ item.quantity }} шт.</span>
          </li>
        </ul>
        <p v-else class="items-unavailable">Состав заказа недоступен.</p>
        <div class="order-total">
          <span>Итого</span>
          <strong>{{ formatPrice(order.totalPriceRub) }}</strong>
        </div>
      </section>
    </template>

    <div v-else class="status-card glass-panel">
      <div class="status-card-copy">
        <h2>Данные заказа недоступны</h2>
        <p>Заказ не найден в истории этого браузера.</p>
        <RouterLink :to="{ name: 'order-history' }" class="catalog-link">Мои заказы</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .status-page {
    --status-accent: color-mix(in srgb, var(--color-accent) 75%, var(--color-text));
    --status-glow: var(--color-navigation-drop-glow);
    --status-panel: color-mix(in srgb, var(--color-card) 82%, var(--color-background));
    --status-shine: color-mix(in srgb, var(--color-text) 12%, transparent);
    --status-line: color-mix(in srgb, var(--color-text-secondary) 50%, var(--color-border));
    --status-spacing: clamp(12px, 2.8vw, 30px);
    --status-radius: clamp(18px, 3.5vw, 36px);
    --step-icon-size: clamp(30px, 5.4vw, 53px);
    display: grid;
    gap: var(--status-spacing);
    padding: var(--status-spacing) clamp(10px, 2.5vw, 26px) clamp(24px, 5vw, 56px);
    background:
      radial-gradient(ellipse at 14% 30%, var(--status-panel), transparent 58%),
      radial-gradient(ellipse at 86% 68%, var(--color-surface), transparent 64%);
  }

  .status-header {
    display: grid;
    gap: var(--space-after-brand-logo);
  }

  .status-brand {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
  }

  .logo {
    grid-column: 2;
    color: var(--color-accent);
  }

  .status-heading {
    font-size: clamp(var(--font-size-heading), 5vw, 50px);
    text-align: center;
  }

  .status-card-copy p,
  .order-meta dt,
  .items-heading span,
  .items-unavailable,
  .item-copy .item-options {
    color: var(--color-text-secondary);
    font-size: clamp(13px, 2.2vw, 22px);
    line-height: 1.4;
  }

  .icon {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .back-button,
  .copy-button {
    display: grid;
    place-items: center;
    border: 1px solid var(--color-border);
    color: var(--color-text);
    background: var(--status-panel);
    cursor: pointer;
  }

  .back-button {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
    width: clamp(44px, 7vw, 70px);
    aspect-ratio: 1;
    border-radius: clamp(14px, 2vw, 22px);
  }

  .back-button:focus-visible,
  .copy-button:focus-visible,
  .catalog-link:focus-visible {
    outline: 2px solid var(--status-accent);
    outline-offset: 2px;
  }

  .back-button:hover,
  .copy-button:hover {
    background: var(--color-navigation-drop);
  }

  .glass-panel {
    border: 1px solid var(--color-border);
    border-radius: var(--status-radius);
    background:
      linear-gradient(145deg, var(--status-shine), transparent 50%),
      linear-gradient(0deg, var(--color-navigation-drop), transparent 74%), var(--status-panel);
    box-shadow: inset 0 1px 1px var(--status-shine);
  }

  .status-steps {
    --steps-padding: clamp(8px, 1.6vw, 16px);
    --step-motion: 420ms cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    isolation: isolate;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    margin: 0;
    padding: var(--steps-padding);
    border-radius: clamp(28px, 9vw, 96px);
    list-style: none;
  }

  .status-steps::before {
    position: absolute;
    z-index: 1;
    box-sizing: border-box;
    inset: var(--steps-padding) auto var(--steps-padding) var(--steps-padding);
    width: calc((100% - 2 * var(--steps-padding)) / var(--step-count));
    border: 1px solid var(--color-navigation-active-border);
    border-radius: clamp(20px, 5.5vw, 58px);
    background:
      linear-gradient(158deg, var(--status-shine), transparent 55%), var(--color-navigation-drop);
    box-shadow:
      inset 0 1px 4px var(--color-navigation-drop-shine),
      inset 0 -3px 8px var(--status-glow),
      0 0 12px var(--status-glow);
    pointer-events: none;
    transform: translateX(calc(var(--step-index) * 100%));
    transition:
      transform var(--step-motion),
      width var(--step-motion);
    content: '';
  }

  .status-step {
    position: relative;
    display: grid;
    padding-inline: clamp(2px, 0.8vw, 8px);
    color: var(--color-text-secondary);
    text-align: center;
  }

  .status-step:not(:last-child)::after {
    position: absolute;
    top: calc(clamp(8px, 2vw, 20px) + 1px + var(--step-icon-size) / 2);
    left: 50%;
    width: 100%;
    height: 2px;
    background-color: var(--status-line);
    transition:
      background-color var(--step-motion),
      box-shadow var(--step-motion);
    content: '';
  }

  .status-step--done:not(:last-child)::after {
    background-color: var(--status-accent);
    box-shadow: 0 0 8px var(--status-glow);
  }

  .step-content {
    display: grid;
    justify-items: center;
    align-content: start;
    gap: clamp(6px, 1.2vw, 12px);
    padding: clamp(8px, 2vw, 20px) 2px;
    border: 1px solid transparent;
  }

  .step-icon {
    z-index: 2;
    display: grid;
    width: var(--step-icon-size);
    aspect-ratio: 1;
    place-items: center;
    border: 2px solid var(--status-line);
    border-radius: 50%;
    background-color: var(--status-panel);
    transition:
      background-color var(--step-motion),
      border-color var(--step-motion),
      box-shadow var(--step-motion),
      color var(--step-motion);
  }

  .step-icon .icon {
    width: 65%;
    height: 65%;
    transition: scale var(--step-motion);
  }

  .status-step--done .step-icon {
    border-color: var(--status-accent);
    color: var(--color-background);
    background-color: var(--status-accent);
    box-shadow: 0 0 14px var(--status-glow);
  }

  .status-step--current .step-icon {
    border-color: transparent;
    color: var(--status-accent);
    background-color: transparent;
  }

  .status-step--current .step-icon .icon {
    scale: 1.5;
  }

  .step-label {
    z-index: 2;
    max-width: 12ch;
    font-size: clamp(10px, 2.2vw, 22px);
    font-weight: var(--font-weight-semibold);
    line-height: 1.2;
    transition: color var(--step-motion);
  }

  .status-step--done .step-label,
  .status-step--current .step-label {
    color: var(--color-text);
  }

  .status-card {
    display: flex;
    align-items: center;
    gap: clamp(10px, 3vw, 32px);
    padding: clamp(12px, 2vw, 20px);
  }

  .status-card-icon {
    display: grid;
    width: clamp(48px, 13vw, 123px);
    flex: none;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid var(--color-border);
    border-radius: var(--status-radius);
    color: var(--status-accent);
    background: var(--color-navigation-drop);
    box-shadow: inset 0 1px 4px var(--status-shine);
  }

  .status-card-icon .icon {
    width: 56%;
    height: 56%;
  }

  .status-message-enter-active {
    transition:
      opacity 260ms ease-out,
      transform 260ms ease-out;
  }

  .status-message-enter-from {
    opacity: 0.45;
    transform: translateY(3px);
  }

  .status-message-leave-active {
    display: none;
  }

  .status-card-copy,
  .item-copy {
    display: grid;
    min-width: 0;
    gap: 4px;
    overflow-wrap: anywhere;
  }

  .status-card-copy h2,
  .items-heading h2 {
    font-size: clamp(18px, 3.25vw, 33px);
  }

  .order-meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin: 0;
    padding-inline: clamp(4px, 3.2vw, 34px);
  }

  .order-meta > div {
    display: grid;
    align-content: start;
    gap: 4px;
  }

  .order-meta > div + div {
    padding-inline-start: clamp(10px, 5vw, 56px);
    border-inline-start: 1px solid var(--color-border);
  }

  .order-meta dd {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0;
    font-size: clamp(15px, 2.65vw, 27px);
    font-weight: var(--font-weight-bold);
    line-height: 1.2;
  }

  .copy-button {
    width: clamp(36px, 4vw, 44px);
    aspect-ratio: 1;
    padding: 0;
    border-radius: 50%;
    color: var(--color-text-secondary);
  }

  .copy-button .icon {
    width: 52%;
    height: 52%;
  }

  .order-items {
    display: grid;
    gap: clamp(8px, 1.5vw, 16px);
    padding: clamp(12px, 3.5vw, 36px);
    background: linear-gradient(135deg, var(--status-shine), transparent 70%), var(--status-panel);
  }

  .items-heading,
  .order-total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .items-heading span {
    flex: none;
  }

  .item-list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .order-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: clamp(8px, 2.2vw, 22px);
    padding-block: clamp(8px, 1.2vw, 12px);
    border-bottom: 1px solid var(--color-border);
    font-size: clamp(13px, 2.4vw, 24px);
    font-weight: var(--font-weight-semibold);
    line-height: 1.3;
  }

  .item-thumbnail {
    display: grid;
    width: clamp(44px, 9vw, 92px);
    aspect-ratio: 1.1;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--status-line);
    border-radius: var(--radius-product-image-compact);
    color: var(--status-accent);
    background: var(--color-background);
  }

  .item-thumbnail > * {
    grid-area: 1 / 1;
  }

  .item-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-copy .item-options {
    font-size: clamp(11px, 2vw, 20px);
    font-weight: var(--font-weight-regular);
  }

  .item-price {
    white-space: nowrap;
  }

  .order-total {
    font-size: clamp(14px, 2.2vw, 22px);
  }

  .catalog-link {
    justify-self: start;
    color: var(--status-accent);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .status-steps::before,
    .status-step:not(:last-child)::after,
    .step-icon,
    .step-icon .icon,
    .step-label,
    .status-message-enter-active {
      transition: none;
    }
  }
</style>

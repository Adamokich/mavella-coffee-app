<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useCheckoutStore } from '@/features/checkout';
  import { CoffeeIcon, MavellaLogo, OrderStatusIcon } from '@/shared/icons';
  import { formatPrice } from '@/shared/utils';

  const FILTERS = [
    { id: 'all', label: 'Все заказы', icon: 'all' },
    { id: 'active', label: 'В обработке', icon: 'clock' },
    { id: 'completed', label: 'Завершённые', icon: 'done' },
    { id: 'cancelled', label: 'Отменённые', icon: 'cancel' },
  ] as const;

  const STATUSES = {
    PENDING: { label: 'Оформлен', filter: 'active', icon: 'clock' },
    PREPARING: { label: 'Готовится', filter: 'active', icon: null },
    READY: { label: 'Готов к выдаче', filter: 'active', icon: 'done' },
    COMPLETED: { label: 'Завершён', filter: 'completed', icon: 'done' },
    CANCELLED: { label: 'Отменён', filter: 'cancelled', icon: 'cancel' },
  } as const;

  const checkout = useCheckoutStore();
  const activeFilter = ref<(typeof FILTERS)[number]['id']>('all');
  const hasSwitchedFilter = ref(false);
  const filterIndicatorStyle = computed(() => {
    const index = FILTERS.findIndex((filter) => filter.id === activeFilter.value);
    return {
      '--filter-index': index,
      '--filter-column': index % 2,
      '--filter-row': Math.floor(index / 2),
    };
  });
  const orders = computed(() =>
    checkout.orderHistory.filter(
      (order) =>
        order.trackingToken &&
        (activeFilter.value === 'all' || STATUSES[order.status].filter === activeFilter.value),
    ),
  );

  const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const dateFormat = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  function selectFilter(filter: typeof activeFilter.value) {
    if (filter === activeFilter.value) return;
    hasSwitchedFilter.value = true;
    activeFilter.value = filter;
  }

  function orderDate(timestamp?: number) {
    if (typeof timestamp !== 'number') return null;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return null;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const day = date.toDateString();
    let label = dateFormat.format(date);
    if (day === today.toDateString()) label = 'Сегодня';
    if (day === yesterday.toDateString()) label = 'Вчера';
    return { iso: date.toISOString(), label: label + ', ' + timeFormat.format(date) };
  }

  const orderCards = computed(() =>
    orders.value.map((order) => ({
      ...order,
      date: orderDate(order.submittedAt),
      image: order.summary?.find((item) => item.imageUrl)?.imageUrl,
      items: order.summary?.map((item) => item.name).join(', '),
      statusDetails: STATUSES[order.status],
    })),
  );

  function hideBrokenImage(event: Event) {
    if (event.target instanceof HTMLImageElement) event.target.hidden = true;
  }
</script>

<template>
  <section class="history-page" aria-labelledby="history-title">
    <header class="history-header">
      <div class="history-brand">
        <RouterLink :to="{ name: 'catalog' }" class="back-button" aria-label="Вернуться в каталог">
          <OrderStatusIcon name="back" class="icon" />
        </RouterLink>
        <MavellaLogo class="logo" />
      </div>
      <div class="history-heading">
        <h1 id="history-title">Мои заказы</h1>
        <p>История и статус ваших заказов.</p>
      </div>
    </header>

    <div class="history-filters" role="group" aria-label="Фильтр заказов">
      <span class="filter-indicator" :style="filterIndicatorStyle" aria-hidden="true">
        <span
          :key="activeFilter"
          class="filter-drop"
          :class="{ 'filter-drop--moving': hasSwitchedFilter }"
        />
      </span>
      <button
        v-for="filter in FILTERS"
        :key="filter.id"
        type="button"
        :aria-pressed="activeFilter === filter.id"
        @click="selectFilter(filter.id)"
      >
        <OrderStatusIcon :name="filter.icon" class="icon" />
        <span>{{ filter.label }}</span>
      </button>
    </div>

    <div class="history-results">
      <Transition
        name="history-results"
        @before-leave="(element) => element.setAttribute('inert', '')"
      >
        <ul v-if="orderCards.length" :key="activeFilter" class="history-list">
          <li v-for="order in orderCards" :key="order.trackingToken">
            <RouterLink
              :to="{ name: 'order-status', params: { orderId: order.id } }"
              class="order-card"
            >
              <span class="order-image">
                <OrderStatusIcon name="bag" class="icon" />
                <img
                  v-if="order.image"
                  :key="order.image"
                  :src="order.image"
                  alt=""
                  loading="lazy"
                  @error="hideBrokenImage"
                />
              </span>
              <div class="order-description">
                <h2>№{{ order.id }}</h2>
                <time v-if="order.date" :datetime="order.date.iso">{{ order.date.label }}</time>
                <p v-if="order.items">{{ order.items }}</p>
              </div>
              <div class="order-summary">
                <span class="order-badge" :class="'order-badge--' + order.status.toLowerCase()">
                  <OrderStatusIcon
                    v-if="order.statusDetails.icon"
                    :name="order.statusDetails.icon"
                    class="icon"
                  />
                  <CoffeeIcon v-else class="icon" />
                  {{ order.statusDetails.label }}
                </span>
                <strong class="order-price">{{ formatPrice(order.totalPriceRub) }}</strong>
              </div>
              <OrderStatusIcon name="next" class="icon order-chevron" />
            </RouterLink>
          </li>
        </ul>

        <div v-else :key="activeFilter + '-empty'" class="history-empty" role="status">
          <h2>{{ activeFilter === 'all' ? 'Заказов пока нет' : 'Нет заказов с этим статусом' }}</h2>
          <RouterLink v-if="activeFilter === 'all'" :to="{ name: 'catalog' }"
            >Перейти в каталог</RouterLink
          >
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
  .history-page {
    --history-accent: color-mix(in srgb, var(--color-accent) 75%, var(--color-text));
    --history-shine: var(--color-navigation-glass-shine);
    --history-radius: clamp(16px, 3.5vw, 36px);
    --history-gap: clamp(16px, 3.8vw, 38px);
    display: grid;
    gap: var(--history-gap);
    padding: clamp(12px, 2.8vw, 30px) clamp(12px, 3vw, 30px) clamp(24px, 5vw, 56px);
    background: radial-gradient(ellipse at 16% 28%, var(--color-surface), transparent 66%);
  }

  .history-header,
  .history-heading {
    display: grid;
    gap: 8px;
    text-align: center;
  }

  .history-header {
    gap: var(--space-after-brand-logo);
  }

  .history-brand {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
  }

  .logo {
    grid-column: 2;
    color: var(--color-accent);
  }

  .back-button {
    display: grid;
    grid-area: 1 / 1;
    width: clamp(44px, 7vw, 70px);
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid var(--color-border);
    border-radius: clamp(14px, 2vw, 22px);
    color: var(--color-text);
    background: var(--color-card);
  }

  .history-heading h1 {
    font-size: clamp(var(--font-size-heading), 5vw, 50px);
  }

  .history-heading p,
  .order-description time,
  .order-description p {
    color: var(--color-text-secondary);
    font-size: clamp(13px, 2.15vw, 22px);
    line-height: 1.4;
  }

  .icon {
    width: 24px;
    height: 24px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .history-filters,
  .order-card,
  .history-empty {
    border: 1px solid var(--color-border);
    background:
      linear-gradient(145deg, var(--history-shine), transparent 56%),
      linear-gradient(0deg, var(--color-card), var(--color-surface));
    box-shadow: inset 0 1px 2px var(--history-shine);
  }

  .history-filters {
    --filter-spacing: 4px;
    --filter-move-duration: 460ms;
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 1fr;
    gap: var(--filter-spacing);
    padding: var(--filter-spacing);
    border-radius: var(--history-radius);
  }

  .filter-indicator {
    position: absolute;
    top: var(--filter-spacing);
    left: var(--filter-spacing);
    width: calc((100% - 3 * var(--filter-spacing)) / 2);
    height: calc((100% - 3 * var(--filter-spacing)) / 2);
    pointer-events: none;
    transform: translate(
      calc(var(--filter-column) * (100% + var(--filter-spacing))),
      calc(var(--filter-row) * (100% + var(--filter-spacing)))
    );
    transition: transform var(--filter-move-duration) cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .filter-drop {
    position: absolute;
    inset: 0;
    border: 1px solid var(--color-navigation-active-border);
    border-radius: 999px;
    background:
      radial-gradient(ellipse at 50% 115%, var(--color-navigation-drop-glow), transparent 60%),
      linear-gradient(155deg, var(--color-navigation-glass-shine), transparent 42%),
      var(--color-navigation-drop);
    box-shadow:
      inset 0 2px 2px var(--color-navigation-drop-shine),
      inset 0 -2px 4px var(--color-navigation-drop-glow),
      0 0 8px var(--color-navigation-drop-glow),
      var(--shadow-navigation-active);
  }

  .filter-drop::before {
    position: absolute;
    inset: 4px 8px 48%;
    border-radius: 999px 999px 50% 50%;
    background: linear-gradient(var(--color-navigation-glass-shine), transparent);
    content: '';
  }

  .filter-drop--moving {
    animation: filter-drop-move var(--filter-move-duration) ease-in-out;
  }

  @keyframes filter-drop-move {
    0%,
    100% {
      transform: scale(1);
    }

    40% {
      transform: scale(1.04, 0.96);
    }
  }

  .history-filters button {
    position: relative;
    display: flex;
    min-height: 48px;
    align-items: center;
    justify-content: center;
    gap: clamp(4px, 1.2vw, 12px);
    padding: 6px;
    border: 1px solid transparent;
    border-radius: 999px;
    color: var(--color-text-secondary);
    background: transparent;
    font: inherit;
    font-size: clamp(14px, 2.15vw, 22px);
    font-weight: var(--font-weight-semibold);
    line-height: 1.2;
    cursor: pointer;
    transition: color 280ms ease;
  }

  .history-filters button[aria-pressed='true'] {
    color: var(--history-accent);
  }

  .order-badge--preparing,
  .order-badge--pending {
    border-color: var(--color-navigation-active-border);
    color: var(--history-accent);
    background:
      linear-gradient(160deg, var(--history-shine), transparent 55%), var(--color-navigation-drop);
    box-shadow:
      inset 0 1px 3px var(--color-navigation-drop-shine),
      inset 0 -2px 5px var(--color-navigation-drop-glow),
      0 0 8px var(--color-navigation-drop-glow);
  }

  .history-filters .icon {
    width: clamp(22px, 3.6vw, 38px);
    height: clamp(22px, 3.6vw, 38px);
  }

  .order-badge .icon {
    width: clamp(16px, 3.2vw, 34px);
    height: clamp(16px, 3.2vw, 34px);
  }

  .history-page :is(a, button):focus-visible {
    outline: 2px solid var(--history-accent);
    outline-offset: 2px;
  }

  .history-list {
    display: grid;
    gap: clamp(10px, 1.6vw, 16px);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .order-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) fit-content(36%) auto;
    grid-template-areas: 'image description summary arrow';
    align-items: center;
    gap: clamp(6px, 2vw, 12px);
    padding: clamp(10px, 2.25vw, 24px) clamp(8px, 3vw, 18px);
    border-radius: var(--history-radius);
    color: var(--color-text);
    text-decoration: none;
  }

  .order-card:hover {
    border-color: var(--color-navigation-active-border);
  }

  .order-image {
    grid-area: image;
    display: grid;
    width: max(50px, calc(12vw + 6px));
    aspect-ratio: 1.06;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: clamp(10px, 2.25vw, 24px);
    color: var(--history-accent);
    background: var(--color-background);
  }

  .order-image > * {
    grid-area: 1 / 1;
  }

  .order-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .order-description {
    grid-area: description;
    display: grid;
    min-width: 0;
    gap: 7px;
    overflow-wrap: anywhere;
  }

  .order-description h2 {
    font-size: clamp(18px, 3.2vw, 34px);
  }

  .order-description p {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .order-summary {
    grid-area: summary;
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  .order-badge {
    display: inline-flex;
    align-items: center;
    gap: clamp(4px, 1.4vw, 14px);
    padding: clamp(4px, 1vw, 10px) clamp(6px, 2vw, 22px);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background-color: var(--color-card);
    font-size: clamp(11px, 1.9vw, 20px);
    font-weight: var(--font-weight-semibold);
    line-height: 1.2;
  }

  .order-badge:is(.order-badge--ready, .order-badge--cancelled) {
    border-color: color-mix(in srgb, var(--badge-color) 28%, var(--color-border));
    color: var(--badge-color);
    background: color-mix(in srgb, var(--badge-color) 13%, var(--color-surface));
    box-shadow: inset 0 0 8px color-mix(in srgb, var(--badge-color) 14%, transparent);
  }

  .order-badge--ready {
    --badge-color: var(--color-status-ready);
  }

  .order-badge--cancelled {
    --badge-color: var(--color-status-cancelled);
  }

  .order-price {
    font-size: clamp(14px, 2.7vw, 28px);
    white-space: nowrap;
  }

  .order-chevron {
    grid-area: arrow;
    width: clamp(24px, 2.7vw, 28px);
    height: clamp(24px, 2.7vw, 28px);
    color: var(--color-text-secondary);
    stroke-width: 2;
  }

  .history-empty {
    display: grid;
    justify-items: center;
    gap: 8px;
    padding: 24px 16px;
    border-radius: var(--history-radius);
    text-align: center;
  }

  .history-empty a {
    color: var(--history-accent);
  }

  .history-results {
    display: grid;
  }

  .history-results > * {
    grid-area: 1 / 1;
    min-width: 0;
    align-self: start;
  }

  .history-results-enter-active {
    z-index: 1;
    transition:
      opacity 280ms ease-out,
      transform 280ms cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .history-results-leave-active {
    transition: opacity 240ms ease-out;
  }

  .history-results-enter-from {
    opacity: 0;
    transform: translateY(4px);
  }

  .history-results-leave-to {
    opacity: 0;
  }

  @media (min-width: 640px) {
    .history-filters {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      border-radius: 999px;
    }

    .history-filters button {
      min-height: clamp(48px, 7.5vw, 76px);
    }

    .filter-indicator {
      width: calc((100% - 5 * var(--filter-spacing)) / 4);
      height: calc(100% - 2 * var(--filter-spacing));
      transform: translateX(calc(var(--filter-index) * (100% + var(--filter-spacing))));
    }

    .order-card {
      grid-template-columns: auto minmax(0, 1fr) auto auto;
      gap: clamp(10px, 3vw, 32px);
      padding: clamp(12px, 2.25vw, 24px) clamp(10px, 3.6vw, 38px);
    }

    .order-image {
      width: min(12vw, 122px);
    }

    .order-description p {
      display: block;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .filter-drop--moving {
      animation: none;
    }

    .filter-indicator,
    .history-filters button,
    .history-results-enter-active,
    .history-results-leave-active {
      transition: none;
    }
  }
</style>

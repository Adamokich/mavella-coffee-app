import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { isAxiosError } from 'axios';
import { OrderStatus } from '@coffee-app/contracts/orders';
import { createOrder } from '../api/orders';
import type { OrderConfirmation, OrderStatusSnapshot, PendingSubmission } from '../types';

const PENDING_KEY = 'coffee-app:pending-order';
const HISTORY_KEY = 'coffee-app:order-history';

function loadHistory(): OrderConfirmation[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(history)) return [];

    return history
      .filter(
        (order: OrderConfirmation) =>
          Number.isInteger(order?.id) &&
          Object.values(OrderStatus).includes(order.status) &&
          Number.isFinite(order.totalPriceRub) &&
          typeof order.trackingToken === 'string' &&
          order.trackingToken.length > 0 &&
          Array.isArray(order.summary),
      )
      .map((order: OrderConfirmation) => {
        const version = order.version;
        return typeof version === 'number' && Number.isSafeInteger(version) && version > 0
          ? order
          : { ...order, version: undefined };
      });
  } catch {
    return [];
  }
}

function loadPending(): PendingSubmission | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const value: PendingSubmission = JSON.parse(raw);
    if (
      typeof value?.payload?.idempotencyKey !== 'string' ||
      !Array.isArray(value.payload.items) ||
      !Array.isArray(value.summary)
    )
      return null;
    return value;
  } catch {
    return null;
  }
}

export const useCheckoutStore = defineStore('checkout', () => {
  const pending = ref<PendingSubmission | null>(loadPending());
  const orderHistory = ref<OrderConfirmation[]>(loadHistory());
  const lastConfirmedOrder = ref<OrderConfirmation | null>(null);
  const confirmation = computed(() => {
    const latest = lastConfirmedOrder.value;
    if (!latest) return orderHistory.value[0] ?? null;
    return (
      orderHistory.value.find((entry) => entry.trackingToken === latest.trackingToken) ?? latest
    );
  });
  const isSubmitting = ref(false);
  const error = ref<string | null>(null);

  function saveHistory(order: OrderConfirmation) {
    if (!order.trackingToken) return;

    const orders = new Map<string, OrderConfirmation>();
    for (const entry of [...loadHistory(), ...orderHistory.value, order]) {
      const saved = orders.get(entry.trackingToken);
      if (
        !saved ||
        (entry.version ?? 0) > (saved.version ?? 0) ||
        (entry.version === undefined && saved.version === undefined)
      ) {
        orders.set(entry.trackingToken, entry);
      }
    }

    const sorted = [...orders.values()].sort((first, second) => second.id - first.id);

    orderHistory.value = sorted;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(sorted));
    } catch {}
  }

  function updateStatus(order: OrderConfirmation, snapshot: OrderStatusSnapshot) {
    if (snapshot.orderId !== order.id || snapshot.version <= (order.version ?? 0)) return;
    saveHistory({ ...order, status: snapshot.status, version: snapshot.version });
  }

  function discardPending() {
    localStorage.removeItem(PENDING_KEY);
    pending.value = null;
    error.value = null;
  }

  async function submit(submission?: PendingSubmission): Promise<boolean> {
    if (isSubmitting.value) return false;
    const isFirstAttempt = !pending.value;
    if (!pending.value && submission) {
      try {
        const order = { ...submission, submittedAt: Date.now() };
        localStorage.setItem(PENDING_KEY, JSON.stringify(order));
        pending.value = order;
      } catch {
        error.value =
          'Не удалось сохранить заказ для безопасного повтора. Проверьте настройки браузера.';
        return false;
      }
    }
    if (!pending.value) return false;
    isSubmitting.value = true;
    error.value = null;
    try {
      const { payload, summary, submittedAt } = pending.value;
      const response = await createOrder(payload);
      const order = { ...response, summary, submittedAt };
      lastConfirmedOrder.value = order;
      saveHistory(order);
      return true;
    } catch (cause: unknown) {
      const status = isAxiosError(cause) ? cause.response?.status : undefined;
      if (status === 400 && isFirstAttempt) {
        discardPending();
        error.value = 'Кофейня не приняла данные заказа. Проверьте форму и состав корзины.';
      } else if (status && status >= 400 && status < 500) {
        error.value =
          'Не удалось выполнить заказ. Повторите отправку сохранённого заказа или свяжитесь с кофейней.';
      } else {
        error.value =
          'Не удалось получить подтверждение. Заказ мог быть принят. Повторите отправку сохранённого заказа.';
      }
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    pending,
    confirmation,
    orderHistory,
    isSubmitting,
    error,
    submit,
    discardPending,
    updateStatus,
  };
});

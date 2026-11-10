import { ref } from 'vue';
import { defineStore } from 'pinia';
import { isAxiosError } from 'axios';
import type { CreateOrderResponse } from '@coffee-app/contracts';
import { createOrder } from '../api/orders';
import type { PendingSubmission } from '../types';

const PENDING_KEY = 'coffee-app:pending-order';

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
  const confirmation = ref<CreateOrderResponse | null>(null);
  const isSubmitting = ref(false);
  const error = ref<string | null>(null);

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
        localStorage.setItem(PENDING_KEY, JSON.stringify(submission));
        pending.value = submission;
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
      confirmation.value = await createOrder(pending.value.payload);
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
          'Не удалось получить подтверждение. Заказ мог быть принят; повторите отправку сохранённого заказа.';
      }
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  return { pending, confirmation, isSubmitting, error, submit, discardPending };
});

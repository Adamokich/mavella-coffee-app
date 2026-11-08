<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { vMaska } from 'maska/vue';
  import { useCartStore, getCartItemTotal } from '@/features/cart';
  import {
    useCheckoutStore,
    type CheckoutItemSummary,
    type PendingSubmission,
  } from '@/features/checkout';
  import { MavellaLogo } from '@/shared/icons';
  import { formatPrice } from '@/shared/utils';

  const router = useRouter();
  const cart = useCartStore();
  const checkout = useCheckoutStore();
  const customerName = ref(checkout.pending?.payload.customerName ?? '');
  const customerPhone = ref(checkout.pending?.payload.customerPhone ?? '');
  const comment = ref(checkout.pending?.payload.comment ?? '');
  const attempted = ref(false);
  const formError = ref('');

  const nameError = computed(() => {
    const length = customerName.value.trim().length;
    return length < 3 || length > 20 ? 'Введите имя длиной от 3 до 20 символов.' : '';
  });
  const phoneError = computed(() =>
    /^7\d{10}$/.test(customerPhone.value.replace(/\D/g, ''))
      ? ''
      : 'Введите номер телефона полностью.',
  );
  const currentItems = computed(() =>
    cart.items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      selectedOptionIds: item.options?.map((option) => option.id) ?? [],
    })),
  );
  const currentSummary = computed<CheckoutItemSummary[]>(() =>
    cart.items.map((item) => ({
      name: item.product.name,
      options: item.options?.map((option) => option.name) ?? [],
      quantity: item.quantity,
      total: getCartItemTotal(item),
    })),
  );
  const summary = computed(() => checkout.pending?.summary ?? currentSummary.value);
  const summaryTotal = computed(() =>
    summary.value.some((item) => item.total === null)
      ? null
      : summary.value.reduce((total, item) => total + (item.total ?? 0), 0),
  );
  const cartChanged = computed(
    () =>
      checkout.pending &&
      JSON.stringify(checkout.pending.payload.items) !== JSON.stringify(currentItems.value),
  );

  async function submitOrder() {
    if (checkout.isSubmitting) return;
    formError.value = '';
    let submission: PendingSubmission | undefined;
    if (!checkout.pending) {
      attempted.value = true;
      if (nameError.value || phoneError.value) return;
      if (
        !cart.items.length ||
        cart.items.length > 10 ||
        cart.items.some((item) => item.options === null || item.options.length > 30)
      ) {
        formError.value =
          'Проверьте корзину: в заказе должно быть от 1 до 10 позиций с сохранёнными настройками.';
        return;
      }
      if (cart.total === null) {
        formError.value =
          'Не удалось определить стоимость. Вернитесь в корзину и проверьте товары.';
        return;
      }
      const name = customerName.value.trim();
      try {
        submission = {
          payload: {
            idempotencyKey: crypto.randomUUID(),
            customerName: name.charAt(0).toLocaleUpperCase('ru-RU') + name.slice(1),
            customerPhone: customerPhone.value.replace(/\D/g, ''),
            ...(comment.value.trim() ? { comment: comment.value.trim() } : {}),
            items: currentItems.value,
          },
          summary: currentSummary.value,
        };
      } catch {
        formError.value = 'Не удалось подготовить заказ. Обновите страницу и попробуйте снова.';
        return;
      }
    }
    const success = await checkout.submit(submission);
    if (success) {
      if (!cartChanged.value) cart.clear();
      checkout.discardPending();
      await router.push('/order-status');
    }
  }

  function abandonPending() {
    if (
      window.confirm(
        'Предыдущий заказ мог быть принят кофейней. Если начать новый заказ, он может продублироваться. Вы проверили статус и хотите продолжить?',
      )
    ) {
      checkout.discardPending();
    }
  }
</script>

<template>
  <section class="checkout-page">
    <header class="checkout-header">
      <RouterLink class="back" to="/cart" aria-label="Вернуться в корзину">←</RouterLink>
      <MavellaLogo class="logo" centered />
    </header>
    <h1>Оформление заказа</h1>
    <form class="checkout-form" novalidate @submit.prevent="submitOrder">
      <section class="checkout-section">
        <h2>Контактные данные</h2>
        <label for="checkout-name">Ваше имя</label>
        <input
          id="checkout-name"
          v-model="customerName"
          :disabled="Boolean(checkout.pending) || checkout.isSubmitting"
          maxlength="20"
          autocomplete="name"
          :aria-invalid="attempted && Boolean(nameError)"
          :aria-describedby="attempted && nameError ? 'name-error' : undefined"
        />
        <p v-if="attempted && nameError" id="name-error" class="error">{{ nameError }}</p>
        <label for="checkout-phone">Номер телефона</label>
        <input
          id="checkout-phone"
          v-model="customerPhone"
          v-maska="'+7 (###) ###-##-##'"
          :disabled="Boolean(checkout.pending) || checkout.isSubmitting"
          type="tel"
          autocomplete="tel"
          inputmode="tel"
          placeholder="+7 (___) ___-__-__"
          :aria-invalid="attempted && Boolean(phoneError)"
          :aria-describedby="attempted && phoneError ? 'phone-error' : undefined"
        />
        <p v-if="attempted && phoneError" id="phone-error" class="error">{{ phoneError }}</p>
      </section>
      <section class="checkout-section">
        <h2>Состав заказа</h2>
        <div class="order-summary">
          <div v-for="(item, index) in summary" :key="index" class="summary-item">
            <div>
              <strong>{{ item.name }} ×{{ item.quantity }}</strong>
              <p v-if="item.options.length">{{ item.options.join(', ') }}</p>
            </div>
            <strong>{{ item.total === null ? 'Цена недоступна' : formatPrice(item.total) }}</strong>
          </div>
          <div v-if="!summary.length">
            Корзина пуста. <RouterLink to="/">Перейти в каталог</RouterLink>
          </div>
          <div class="summary-total">
            <span>Итого</span
            ><strong>{{
              summaryTotal === null ? 'Цена недоступна' : formatPrice(summaryTotal)
            }}</strong>
          </div>
        </div>
      </section>
      <section class="checkout-section">
        <label class="section-label" for="checkout-comment">Комментарий</label>
        <textarea
          id="checkout-comment"
          v-model="comment"
          :disabled="Boolean(checkout.pending) || checkout.isSubmitting"
          maxlength="200"
          placeholder="Пожелания к заказу (необязательно)"
        />
      </section>
      <div v-if="checkout.pending" class="pending-notice" role="status">
        <p>
          Предыдущая отправка не подтверждена. Повтор будет выполнен с теми же данными и ключом,
          чтобы не создать дубликат.
        </p>
        <p v-if="cartChanged">
          Корзина изменилась. Ниже указан сохранённый заказ; после его подтверждения текущая корзина
          останется.
        </p>
        <button type="button" :disabled="checkout.isSubmitting" @click="abandonPending">
          Начать новый заказ
        </button>
      </div>
      <p v-if="formError || checkout.error" class="error" role="alert">
        {{ formError || checkout.error }}
      </p>
      <button
        class="submit"
        type="submit"
        :disabled="checkout.isSubmitting || (!checkout.pending && !cart.items.length)"
      >
        {{ checkout.pending ? 'Повторить отправку' : 'Подтвердить заказ' }}
      </button>
    </form>
    <Teleport to="body">
      <div v-if="checkout.isSubmitting" class="loading-overlay" role="status" aria-live="polite">
        <div class="loading-card">
          <span class="loading-cup" aria-hidden="true">☕</span
          ><strong>Оформляем ваш заказ...</strong>
          <p>Пожалуйста, подождите немного.</p>
          <span class="spinner" aria-hidden="true" />
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
  .checkout-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 640px;
    margin-inline: auto;
    padding: 12px 16px 24px;
  }
  .checkout-header {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .logo {
    width: min(230px, 70%);
    color: var(--color-accent);
  }
  .back {
    position: absolute;
    left: 0;
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    color: var(--color-accent);
    background: var(--color-card);
    border-radius: 50%;
    text-decoration: none;
    font-size: 24px;
  }
  .checkout-form,
  .checkout-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .checkout-form {
    gap: 20px;
  }
  .checkout-section h2,
  .section-label {
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-bold);
  }
  label:not(.section-label) {
    color: var(--color-text-secondary);
    font-size: var(--font-size-secondary);
  }
  input,
  textarea {
    width: 100%;
    padding: 12px 14px;
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    font: inherit;
  }
  input {
    min-height: 48px;
  }
  textarea {
    min-height: 80px;
    resize: vertical;
  }
  input[aria-invalid='true'] {
    border-color: var(--color-accent);
  }
  input:disabled,
  textarea:disabled {
    opacity: 0.7;
  }
  .order-summary,
  .pending-notice {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
  }
  .summary-item,
  .summary-total {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .summary-item > strong {
    flex-shrink: 0;
  }
  .summary-item p,
  .pending-notice p {
    color: var(--color-text-secondary);
    font-size: var(--font-size-secondary);
  }
  .summary-total {
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
  }
  .summary-total strong {
    font-size: var(--font-size-price);
  }
  .error {
    color: var(--color-accent);
    font-size: var(--font-size-secondary);
  }
  .submit,
  .pending-notice button {
    min-height: 52px;
    padding: 0 16px;
    color: var(--color-background);
    background: var(--color-accent);
    border: 0;
    border-radius: 999px;
    font: inherit;
    font-weight: var(--font-weight-bold);
    cursor: pointer;
  }
  .submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  a {
    color: var(--color-accent);
  }
  button:focus-visible,
  a:focus-visible,
  input:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .loading-overlay {
    position: fixed;
    z-index: 200;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 16px;
    background: var(--color-modal-scrim);
  }
  .loading-card {
    display: flex;
    width: min(100%, 420px);
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px 20px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 24px;
    text-align: center;
  }
  .loading-card strong {
    font-size: var(--font-size-section-heading);
  }
  .loading-card p {
    color: var(--color-text-secondary);
  }
  .loading-cup {
    font-size: 40px;
  }
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 900ms linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation: none;
    }
  }
</style>

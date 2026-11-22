import { OrderStatus } from '@coffee-app/contracts/orders';
import { isAxiosError } from 'axios';
import { io } from 'socket.io-client';
import { ref, watch } from 'vue';
import { getOrderStatus } from '../api/orders';
import { useCheckoutStore } from '../stores/checkout.store';
import type { OrderConfirmation, OrderStatusSnapshot } from '../types';
import {
  delaySubscriptions,
  getSubscriptionDelay,
  recordSubscriptionAttempt,
} from '../utils/order-subscription-limit';

const STATUS_REFRESH_INTERVAL = 15_000;
const MAX_REFRESH_INTERVAL = 60_000;
const SUBSCRIPTION_TIMEOUT = 5_000;
const RECONNECT_DELAYS = [5_000, 10_000, 20_000, 40_000, 60_000] as const;
const UNAVAILABLE_HTTP_STATUSES = [401, 403, 404];
const ORDER_STATUSES = Object.values(OrderStatus);

function parseSnapshot(payload: unknown, orderId: number): OrderStatusSnapshot | null {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('orderId' in payload) ||
    payload.orderId !== orderId ||
    !('version' in payload) ||
    typeof payload.version !== 'number' ||
    !Number.isSafeInteger(payload.version) ||
    payload.version < 1 ||
    !('status' in payload)
  ) {
    return null;
  }

  const status = ORDER_STATUSES.find((value) => value === payload.status);
  return status ? { orderId, status, version: payload.version } : null;
}

function isFinalStatus(status: OrderStatus) {
  return status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED;
}

export function useOrderTracking(getOrder: () => OrderConfirmation | null) {
  const checkout = useCheckoutStore();
  const trackingState = ref<'tracking' | 'recovering' | 'unavailable'>('tracking');

  watch(
    [() => getOrder()?.id, () => getOrder()?.trackingToken],
    ([orderId, trackingToken], _previous, onCleanup) => {
      trackingState.value = 'tracking';
      const order = getOrder();
      if (!orderId || !trackingToken || !order || isFinalStatus(order.status)) return;

      const credentials = { orderId, trackingToken };
      const socket = io({
        path: '/socket.io/',
        transports: ['websocket'],
        autoConnect: false,
        reconnection: false,
        timeout: SUBSCRIPTION_TIMEOUT,
      });
      const controller = new AbortController();
      let subscriptionTimer: number | undefined;
      let refreshTimer: number | undefined;
      let reconnectTimer: number | undefined;
      let reconnectAttempt = 0;
      let refreshInterval = STATUS_REFRESH_INTERVAL;
      let subscribed = false;
      let fallbackActive = false;
      let subscriptionsDisabled = false;
      let refreshInFlight = false;
      let refreshQueued = false;

      function currentOrder() {
        if (controller.signal.aborted) return null;
        const current = getOrder();
        return current?.id === credentials.orderId &&
          current.trackingToken === credentials.trackingToken
          ? current
          : null;
      }

      function closeSocket() {
        window.clearTimeout(subscriptionTimer);
        subscribed = false;
        socket.disconnect();
      }

      function stop() {
        controller.abort();
        window.clearTimeout(refreshTimer);
        window.clearTimeout(reconnectTimer);
        socket.removeAllListeners();
        closeSocket();
      }

      function applySnapshot(payload: unknown, checkForGap = false) {
        const current = currentOrder();
        const snapshot = parseSnapshot(payload, credentials.orderId);
        if (!current || !snapshot) return false;

        const previousVersion = current.version;
        checkout.updateStatus(current, snapshot);
        const updated = currentOrder();
        if (!updated) return false;

        if (isFinalStatus(updated.status)) {
          trackingState.value = 'tracking';
          stop();
        } else if (
          checkForGap &&
          previousVersion !== undefined &&
          snapshot.version > previousVersion + 1 &&
          updated.version === snapshot.version
        ) {
          requestRefresh();
        }
        return true;
      }

      function requestRefresh(queueIfBusy = true) {
        if (!currentOrder()) return;
        window.clearTimeout(refreshTimer);
        if (refreshInFlight) {
          refreshQueued ||= queueIfBusy;
          return;
        }

        void refresh();
      }

      async function refresh() {
        refreshInFlight = true;
        let refreshed = false;
        try {
          const snapshot = await getOrderStatus(
            credentials.orderId,
            credentials.trackingToken,
            controller.signal,
          );
          refreshed = applySnapshot(snapshot);
        } catch (error) {
          if (
            currentOrder() &&
            isAxiosError(error) &&
            error.response &&
            UNAVAILABLE_HTTP_STATUSES.includes(error.response.status)
          ) {
            trackingState.value = 'unavailable';
            stop();
          }
        } finally {
          refreshInFlight = false;
        }

        if (!currentOrder()) return;
        refreshInterval = refreshed
          ? STATUS_REFRESH_INTERVAL
          : Math.min(refreshInterval * 2, MAX_REFRESH_INTERVAL);
        if (!refreshed) trackingState.value = 'recovering';

        if (refreshQueued) {
          refreshQueued = false;
          requestRefresh();
        } else if (subscribed && refreshed) {
          fallbackActive = false;
          reconnectAttempt = 0;
          trackingState.value = 'tracking';
        } else {
          refreshTimer = window.setTimeout(requestRefresh, refreshInterval);
        }
      }

      function startHttpFallback() {
        trackingState.value = 'recovering';
        if (fallbackActive) return;
        fallbackActive = true;
        requestRefresh(false);
      }

      function scheduleReconnect(delay: number) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(connectWhenAllowed, delay);
      }

      function deferSubscription() {
        const delay = getSubscriptionDelay();
        if (delay === 0) return false;
        closeSocket();
        startHttpFallback();
        scheduleReconnect(delay);
        return true;
      }

      function connectWhenAllowed() {
        if (!currentOrder() || subscriptionsDisabled || deferSubscription()) return;
        socket.connect();
      }

      function recoverConnection() {
        if (!currentOrder()) return;
        closeSocket();
        startHttpFallback();
        if (subscriptionsDisabled) return;
        const delay = RECONNECT_DELAYS[reconnectAttempt] ?? MAX_REFRESH_INTERVAL;
        reconnectAttempt = Math.min(reconnectAttempt + 1, RECONNECT_DELAYS.length);
        scheduleReconnect(Math.max(delay, getSubscriptionDelay()));
      }

      onCleanup(stop);
      socket.on('connect', () => {
        if (!currentOrder() || deferSubscription()) return;
        recordSubscriptionAttempt();
        subscriptionTimer = window.setTimeout(recoverConnection, SUBSCRIPTION_TIMEOUT);
        socket.emit('order:subscribe', credentials);
      });
      socket.on('order:subscribed', (payload: unknown) => {
        if (subscribed || !applySnapshot(payload)) return;
        subscribed = true;
        window.clearTimeout(subscriptionTimer);
        requestRefresh();
      });
      socket.on('order:statusChanged', (payload: unknown) => applySnapshot(payload, true));
      socket.on('exception', (payload: unknown) => {
        if (!currentOrder()) return;
        const code = payload && typeof payload === 'object' && 'code' in payload && payload.code;
        if (code === 'BAD_REQUEST') subscriptionsDisabled = true;
        if (code === 'WS_ERROR') delaySubscriptions();
        recoverConnection();
      });
      socket.on('connect_error', recoverConnection);
      socket.on('disconnect', (reason) => {
        if (reason !== 'io client disconnect') recoverConnection();
      });
      connectWhenAllowed();
    },
    { immediate: true },
  );

  return { trackingState };
}

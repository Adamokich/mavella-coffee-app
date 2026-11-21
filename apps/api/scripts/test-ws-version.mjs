import { io } from 'socket.io-client';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const SERVER_URL = 'http://localhost:3000';

const ORDER_ID = 19;
const TRACKING_TOKEN =
  'cca47b83d2ecb6addb73e1245af7f9143967906e2cd8e834e988f7b328d6ab0f';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getHttpStatus() {
  const response = await fetch(`${SERVER_URL}/orders/${ORDER_ID}/status`, {
    headers: {
      'X-Tracking-Token': TRACKING_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP вернул ${response.status}`);
  }

  return response.json();
}

function subscribe(socket) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Таймаут подписки'));
    }, 5000);

    function cleanup() {
      clearTimeout(timer);
      socket.off('order:subscribed', onSuccess);
      socket.off('exception', onError);
    }

    function onSuccess(data) {
      cleanup();
      resolve(data);
    }

    function onError(error) {
      cleanup();
      reject(new Error(error?.message ?? String(error)));
    }

    socket.once('order:subscribed', onSuccess);
    socket.once('exception', onError);

    socket.emit('order:subscribe', {
      orderId: ORDER_ID,
      trackingToken: TRACKING_TOKEN,
    });
  });
}

async function main() {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  const socket = io(SERVER_URL, {
    autoConnect: false,
    reconnection: false,
    transports: ['websocket'],
  });

  try {
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
      socket.connect();
    });

    console.log('✅ Socket.IO подключён');

    // Шаг 1: получение состояния через WebSocket
    const subscribed = await subscribe(socket);

    console.log('\nWebSocket:', subscribed);

    // Шаг 2: получение состояния через HTTP
    const httpBefore = await getHttpStatus();

    console.log('HTTP:', httpBefore);

    const initialMatch =
      subscribed.orderId === httpBefore.orderId &&
      subscribed.status === httpBefore.status &&
      subscribed.version === httpBefore.version;

    if (!initialMatch) {
      throw new Error('Исходные состояния HTTP и WebSocket не совпадают');
    }

    console.log('✅ Исходные состояния совпадают');

    // Регистрируем обработчик до изменения статуса
    const events = [];

    socket.on('order:statusChanged', (data) => {
      if (data?.orderId === ORDER_ID) {
        events.push(data);
        console.log('\n📨 WebSocket обновление:', data);
      }
    });

    await rl.question(
      '\nИзмени статус заказа через Telegram ' + 'и нажми Enter...\n',
    );

    // Ожидаем событие с новой версией
    const deadline = Date.now() + 15000;
    let updated;

    while (Date.now() < deadline) {
      updated = events.find(
        (event) =>
          Number.isInteger(event.version) && event.version > subscribed.version,
      );

      if (updated) break;

      await sleep(200);
    }

    if (!updated) {
      throw new Error('Не получено WebSocket-событие с новой версией');
    }

    // Шаг 3: сверяем обновлённое состояние с HTTP
    const httpAfter = await getHttpStatus();

    console.log('\nHTTP после изменения:', httpAfter);

    const versionIncremented = updated.version === subscribed.version + 1;

    const finalMatch =
      updated.orderId === httpAfter.orderId &&
      updated.status === httpAfter.status &&
      updated.version === httpAfter.version;

    console.log('\n📊 РЕЗУЛЬТАТ');

    console.log('Версия увеличилась на 1:', versionIncremented);

    console.log('HTTP и WebSocket согласованы:', finalMatch);

    if (versionIncremented && finalMatch) {
      console.log('\n✅ ТЕСТ №5 ПРОЙДЕН');
    } else {
      console.log('\n❌ ТЕСТ №5 НЕ ПРОЙДЕН');
    }
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
  } finally {
    socket.disconnect();
    rl.close();
  }
}

main();

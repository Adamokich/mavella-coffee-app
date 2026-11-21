import { io } from 'socket.io-client';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const SERVER_URL = 'http://localhost:3000';

const ORDER_ID = 20;
const TRACKING_TOKEN =
  'f98c99166d2e3f28b7ddd267f298bbe68228fee5c7a13491cf740d748042722e';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectClient() {
  const socket = io(SERVER_URL, {
    autoConnect: false,
    reconnection: false,
    transports: ['websocket'],
    timeout: 5000,
  });

  try {
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
      socket.connect();
    });

    return socket;
  } catch (error) {
    socket.disconnect();
    throw error;
  }
}

function subscribe(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Таймаут подписки'));
    }, 5000);

    function cleanup() {
      clearTimeout(timeout);
      socket.off('order:subscribed', onSuccess);
      socket.off('exception', onError);
      socket.off('disconnect', onDisconnect);
    }

    function onSuccess(data) {
      cleanup();
      resolve(data);
    }

    function onError(error) {
      cleanup();
      reject(new Error(error?.message ?? String(error)));
    }

    function onDisconnect() {
      cleanup();
      reject(new Error('Соединение разорвано'));
    }

    socket.once('order:subscribed', onSuccess);
    socket.once('exception', onError);
    socket.once('disconnect', onDisconnect);

    socket.emit('order:subscribe', {
      orderId: ORDER_ID,
      trackingToken: TRACKING_TOKEN,
    });
  });
}

async function getHttpStatus() {
  const response = await fetch(`${SERVER_URL}/orders/${ORDER_ID}/status`, {
    headers: {
      'X-Tracking-Token': TRACKING_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ошибка: ${response.status}`);
  }

  return response.json();
}

async function waitForVersion(previousVersion) {
  // Telegram может завершить обработку не мгновенно.
  // Ждём появления новой версии в PostgreSQL.
  for (let i = 0; i < 20; i++) {
    const state = await getHttpStatus();

    if (state.version > previousVersion) {
      return state;
    }

    await sleep(500);
  }

  throw new Error('Статус заказа не изменился. Проверь действие в Telegram.');
}

async function main() {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  let firstSocket;
  let secondSocket;

  try {
    console.log('🚀 Тест восстановления подписки\n');

    // 1. Первоначальное подключение
    firstSocket = await connectClient();

    const firstSocketId = firstSocket.id;
    const initial = await subscribe(firstSocket);

    console.log('✅ Первичная подписка:', initial);
    console.log('Socket ID:', firstSocketId);

    // 2. Разрываем соединение
    firstSocket.disconnect();

    console.log('\n🔌 Соединение разорвано');
    console.log('Клиент больше не получает события');

    // 3. Администратор меняет статус
    await rl.question(
      '\nИзмени статус заказа через Telegram, ' + 'затем нажми Enter...\n',
    );

    const actual = await waitForVersion(initial.version);

    console.log('✅ Статус в PostgreSQL изменился');
    console.log('Актуальное состояние:', actual);

    // 4. Создаём новое WebSocket-соединение
    secondSocket = await connectClient();

    console.log('\n🟢 Новое соединение');
    console.log('Старый Socket ID:', firstSocketId);
    console.log('Новый Socket ID:', secondSocket.id);

    // 5. Повторная подписка
    const recovered = await subscribe(secondSocket);

    console.log('\n📨 Состояние после переподключения:');
    console.log(recovered);

    // 6. Сравниваем данные
    const versionUpdated = recovered.version > initial.version;

    const matchesDatabase =
      recovered.orderId === actual.orderId &&
      recovered.status === actual.status &&
      recovered.version === actual.version;

    const newConnection = secondSocket.id !== firstSocketId;

    console.log('\n📊 РЕЗУЛЬТАТ');
    console.log('Новое соединение:', newConnection);
    console.log('Версия обновилась:', versionUpdated);
    console.log('Совпадает с HTTP:', matchesDatabase);

    if (newConnection && versionUpdated && matchesDatabase) {
      console.log('\n✅ ТЕСТ №6 ПРОЙДЕН');
      console.log(
        'Пропущенное изменение восстановлено ' + 'при повторной подписке',
      );
    } else {
      console.log('\n❌ ТЕСТ №6 НЕ ПРОЙДЕН');
    }
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
  } finally {
    firstSocket?.disconnect();
    secondSocket?.disconnect();
    rl.close();
  }
}

main();

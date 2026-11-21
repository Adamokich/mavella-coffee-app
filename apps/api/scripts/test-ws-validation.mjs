import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

const ORDER_ID = 19;
const TRACKING_TOKEN =
  'cca47b83d2ecb6addb73e1245af7f9143967906e2cd8e834e988f7b328d6ab0f';

const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: false,
  transports: ['websocket'],
  timeout: 5000,
});

function sendSubscribe(payload) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve({ type: 'timeout' });
    }, 3000);

    function cleanup() {
      clearTimeout(timeout);
      socket.off('order:subscribed', onSuccess);
      socket.off('exception', onException);
    }

    function onSuccess(data) {
      cleanup();
      resolve({ type: 'allowed', data });
    }

    function onException(error) {
      cleanup();

      const message =
        typeof error === 'string'
          ? error
          : (error?.message ?? JSON.stringify(error));

      resolve({ type: 'rejected', message });
    }

    socket.on('order:subscribed', onSuccess);
    socket.on('exception', onException);

    socket.emit('order:subscribe', payload);
  });
}

async function main() {
  try {
    if (!/^[a-f0-9]{64}$/.test(TRACKING_TOKEN)) {
      throw new Error('Укажи действительный trackingToken из 64 hex-символов');
    }

    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
      socket.connect();
    });

    console.log('🟢 Подключено:', socket.id);
    console.log('\n🚀 Тестирование Zod-валидации\n');

    const tests = [
      {
        name: 'orderId передан строкой',
        payload: {
          orderId: String(ORDER_ID),
          trackingToken: TRACKING_TOKEN,
        },
      },
      {
        name: 'orderId равен нулю',
        payload: {
          orderId: 0,
          trackingToken: TRACKING_TOKEN,
        },
      },
      {
        name: 'orderId — дробное число',
        payload: {
          orderId: 1.5,
          trackingToken: TRACKING_TOKEN,
        },
      },
      {
        name: 'Некорректный trackingToken',
        payload: {
          orderId: ORDER_ID,
          trackingToken: 'invalid-token',
        },
      },
      {
        name: 'Отсутствует trackingToken',
        payload: {
          orderId: ORDER_ID,
        },
      },
      {
        name: 'Токен с заглавными буквами',
        payload: {
          orderId: ORDER_ID,
          trackingToken: 'A'.repeat(64),
        },
      },
      {
        name: 'Лишнее поле в объекте',
        payload: {
          orderId: ORDER_ID,
          trackingToken: TRACKING_TOKEN,
          isAdmin: true,
        },
      },
    ];

    let passed = 0;

    for (const [index, test] of tests.entries()) {
      const result = await sendSubscribe(test.payload);

      const isValidationError =
        result.type === 'rejected' &&
        !/превышено количество попыток/i.test(result.message);

      const success = isValidationError && socket.connected;

      console.log(`${success ? '✅' : '❌'} Тест ${index + 1}: ${test.name}`);

      console.log('   Ответ:', result.message ?? result.type);

      if (success) passed++;
    }

    console.log('\n🔍 Проверка работоспособности Gateway');

    const validResult = await sendSubscribe({
      orderId: ORDER_ID,
      trackingToken: TRACKING_TOKEN,
    });

    const validSuccess =
      validResult.type === 'allowed' &&
      validResult.data?.orderId === ORDER_ID &&
      Number.isInteger(validResult.data?.version);

    if (validSuccess) {
      console.log('✅ Корректная подписка после ошибок работает');
      passed++;
    } else {
      console.log('❌ Корректная подписка не выполнена');
      console.log(validResult);
    }

    console.log('\n📊 ИТОГ ТЕСТИРОВАНИЯ');
    console.log(`Успешно: ${passed}/8`);

    if (passed === 8) {
      console.log('\n✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ');
    } else {
      console.log('\n❌ ЕСТЬ ОШИБКИ');
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    socket.disconnect();
  }
}

main();

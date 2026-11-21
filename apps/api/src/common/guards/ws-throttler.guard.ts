import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration, generateKey } =
      requestProps;

    const client = context.switchToWs().getClient<Socket>();
    const tracker = client.handshake.address;
    const throttlerName = throttler.name ?? 'default';

    const key = generateKey(context, tracker, throttlerName);

    const { isBlocked } = await this.storageService.increment(
      key,
      ttl,
      limit,
      blockDuration,
      throttlerName,
    );

    if (isBlocked) {
      throw new WsException(
        'Ошибка. Превышено количество попыток для отправки события',
      );
    }

    return true;
  }
}

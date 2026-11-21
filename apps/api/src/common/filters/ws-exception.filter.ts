import { ArgumentsHost, BadRequestException, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

@Catch(WsException, BadRequestException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(
    exception: WsException | BadRequestException,
    host: ArgumentsHost,
  ): void {
    const client = host.switchToWs().getClient<Socket>();

    if (exception instanceof BadRequestException) {
      const response = exception.getResponse();

      const message =
        typeof response === 'string'
          ? response
          : (response as { message?: string }).message ||
            'Некорректные данные запроса';

      client.emit('exception', {
        status: 'error',
        code: 'BAD_REQUEST',
        message,
      });
      return;
    }

    const error = exception.getError();

    const message =
      typeof error === 'string'
        ? error
        : (error as { message?: string }).message || 'Ошибка обработки запроса';

    client.emit('exception', {
      status: 'error',
      code: 'WS_ERROR',
      message,
    });
  }
}

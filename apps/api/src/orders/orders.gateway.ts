import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { OrdersService } from './orders.service.js';
import type { Socket, Server } from 'socket.io';
import type {
  OrderStatusPayload,
  SubscribeOrderPayload,
} from './types/order.type.js';
import { subscribeOrderSchema } from './dto/subscribe-order.schema.js';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter.js';
import { HttpException, UseFilters, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WsThrottlerGuard } from '../common/guards/ws-throttler.guard.js';

@UseFilters(WsExceptionFilter)
@WebSocketGateway()
export class OrdersGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly ordersService: OrdersService) {}

  @SubscribeMessage('order:subscribe')
  @UseGuards(WsThrottlerGuard)
  async handleOrderSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody({ schema: subscribeOrderSchema })
    { orderId, trackingToken }: SubscribeOrderPayload,
  ) {
    try {
      const order = await this.ordersService.getOrderStatus(
        orderId,
        trackingToken,
      );

      await client.join(`order:${order.orderId}`);

      client.emit('order:subscribed', {
        orderId: order.orderId,
        status: order.status,
        version: order.version,
      });
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw new WsException(error.message);
      }

      throw new WsException('Не удалось подписаться на обновления заказа');
    }
  }

  @OnEvent('order.status.changed')
  handleOrderStatus({ orderId, status, version }: OrderStatusPayload) {
    this.server.to(`order:${orderId}`).emit(`order:statusChanged`, {
      orderId,
      status,
      version,
    });
  }
}

import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { OrdersGateway } from './orders.gateway.js';

@Module({
  imports: [TelegramModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway],
  exports: [OrdersService],
})
export class OrdersModule {}

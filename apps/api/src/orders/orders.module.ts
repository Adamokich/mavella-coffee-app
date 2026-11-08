import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { TelegramService } from '../telegram/telegram.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, TelegramService],
})
export class OrdersModule {}

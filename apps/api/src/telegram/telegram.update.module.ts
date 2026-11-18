import { Module } from '@nestjs/common';
import { TelegramUpdateService } from './telegram.update.service.js';
import { TelegramRunnerService } from './telegram.runner.service.js';
import { TelegramModule } from './telegram.module.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  imports: [TelegramModule, OrdersModule],
  providers: [TelegramRunnerService, TelegramUpdateService],
})
export class TelegramUpdateModule {}

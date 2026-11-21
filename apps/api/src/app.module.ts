import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { ProductModule } from './product/product.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { TelegramModule } from './telegram/telegram.module.js';
import { TelegramUpdateModule } from './telegram/telegram.update.module.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    PrismaModule,
    CatalogModule,
    ProductModule,
    OrdersModule,
    TelegramModule,
    TelegramUpdateModule,
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'long',
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

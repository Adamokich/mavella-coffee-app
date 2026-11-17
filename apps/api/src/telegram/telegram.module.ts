import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service.js';
import { Telegraf } from 'telegraf';
import { TELEGRAM_BOT } from './telegram.constants.js';

@Module({
  providers: [
    {
      provide: TELEGRAM_BOT,
      useFactory: () => {
        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (!token) {
          throw new Error('Telegram token not found');
        }

        return new Telegraf(token);
      },
    },
    TelegramService,
  ],
  exports: [TelegramService, TELEGRAM_BOT],
})
export class TelegramModule {}

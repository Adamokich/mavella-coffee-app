import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { TELEGRAM_BOT } from './telegram.constants.js';
import { getTrackingToken } from '../orders/utils/tracking-token.js';

@Injectable()
export class TelegramRunnerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(TelegramRunnerService.name);
  private started = false;

  constructor(@Inject(TELEGRAM_BOT) private readonly bot: Telegraf<Context>) {}

  onApplicationBootstrap() {
    if (process.env.TELEGRAM_POLLING_ENABLED !== 'true') {
      return;
    }

    void this.bot
      .launch(() => {
        this.started = true;
        this.logger.log('Telegram bot started');
      })
      .catch(() => {
        this.started = false;
        this.logger.error('Telegram polling failed');
      });
  }

  onModuleDestroy() {
    if (!this.started) return;

    this.bot.stop('Telegram bot stopped');
    this.started = false;
  }
}

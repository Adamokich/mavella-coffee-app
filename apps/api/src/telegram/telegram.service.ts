import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { getOrderKeyboard } from './keyboards/order-keyboard.js';
import { TELEGRAM_BOT } from './telegram.constants.js';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(@Inject(TELEGRAM_BOT) private readonly bot: Telegraf<Context>) {}

  async sendOrderNotification(orderId: number, message: string): Promise<void> {
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!chatId) {
      throw new Error('Telegram chat not found');
    }

    try {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        ...getOrderKeyboard(orderId, 'PENDING'),
      });
    } catch (error: unknown) {
      this.logger.error('Failed to send Telegram notification');
      throw error;
    }
  }
}

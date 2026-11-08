import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface TelegramResponse {
  ok: boolean;
}

interface TelegramMessagePayload {
  chat_id: string;
  text: string;
  parse_mode: 'HTML';
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  async sendMessage(message: string): Promise<void> {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      throw new Error('Telegram configuration is missing');
    }

    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    const payload: TelegramMessagePayload = {
      chat_id: telegramChatId,
      text: message,
      parse_mode: 'HTML',
    };

    try {
      const { data } = await axios.post<TelegramResponse>(url, payload, {
        timeout: 10000,
        maxRedirects: 0,
      });

      if (!data.ok) {
        throw new Error('Telegram rejected the message');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        this.logger.warn(
          `Telegram request failed. Status: ${error.response?.status ?? 'unknown'}, Code: ${error.code ?? 'unknown'}`,
        );
      } else {
        this.logger.warn('Telegram message was not accepted');
      }

      throw new Error('Failed to send Telegram notification');
    }
  }
}

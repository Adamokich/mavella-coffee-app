import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Context, Markup, Telegraf, TelegramError } from 'telegraf';
import { OrdersService } from '../orders/orders.service.js';
import { getOrderKeyboard } from './keyboards/order-keyboard.js';
import { OrderStatus } from '../prisma/generated/prisma/enums.js';
import { getOrderStatusLabel } from './utils/order-status-label.js';
import { TELEGRAM_BOT } from './telegram.constants.js';
import { formatActiveOrdersMessage } from './utils/format-active-orders.js';
import { getActiveOrdersKeyboard } from './keyboards/active-orders.keyboard.js';
import { getActiveOrderKeyboard } from './keyboards/active-order.keyboard.js';

@Injectable()
export class TelegramUpdateService implements OnModuleInit {
  private readonly logger = new Logger(TelegramUpdateService.name);

  constructor(
    @Inject(TELEGRAM_BOT) private readonly bot: Telegraf<Context>,
    private readonly ordersService: OrdersService,
  ) {}

  onModuleInit() {
    this.bot.action(
      /^order:(accept|cancelled|ready|complete):([1-9]\d*)(?::(PENDING|PREPARING|READY):([1-9]\d*))?$/,
      async (ctx) => {
        if (!this.isAdmin(ctx)) {
          await ctx.answerCbQuery('Недостаточно прав');
          return;
        }

        const action = ctx.match[1];
        const orderId = Number(ctx.match[2]);
        const originStatus = ctx.match[3] as OrderStatus;
        const originPage = Number(ctx.match[4]);

        if (orderId) {
          if (!Number.isSafeInteger(orderId) || orderId <= 0) {
            await ctx.answerCbQuery('Некорректный ID заказа');
            return;
          }
        }

        if (originPage) {
          if (!Number.isSafeInteger(originPage)) {
            await ctx.answerCbQuery('Некорректный номер страницы');
          }
        }

        let newStatus: OrderStatus;

        try {
          switch (action) {
            case 'accept':
              await this.ordersService.acceptOrder(orderId);
              newStatus = 'PREPARING';
              break;
            case 'cancelled':
              await this.ordersService.rejectOrder(orderId);
              newStatus = 'CANCELLED';
              break;
            case 'ready':
              await this.ordersService.markOrderReady(orderId);
              newStatus = 'READY';
              break;
            case 'complete':
              await this.ordersService.markOrderCompleted(orderId);
              newStatus = 'COMPLETED';
              break;
            default:
              await ctx.answerCbQuery('Неизвестное действие');
              return;
          }
        } catch (error: unknown) {
          if (error instanceof NotFoundException) {
            await ctx.answerCbQuery('Заказ не найден');
            return;
          }

          if (error instanceof ConflictException) {
            await ctx.answerCbQuery('Статус заказа обработан или обратывается');
            return;
          }

          await ctx.answerCbQuery('Не удалось изменить статус заказа');
          this.logger.error('Не удалось изменить статус заказа');

          return;
        }

        const updated = await this.updateOrderMessage(
          ctx,
          orderId,
          newStatus,
          originStatus,
          originPage,
        );

        await ctx.answerCbQuery(
          updated
            ? 'Статус заказа изменен'
            : 'Статус заказа изменен, но сообщение не обновилось',
        );
      },
    );

    this.bot.action(
      /^active:status:(PENDING|PREPARING|READY)(?::([1-9]\d*))?$/,
      async (ctx) => {
        if (!this.isAdmin(ctx)) {
          await ctx.answerCbQuery('Недостаточно прав');
          return;
        }

        try {
          const status = ctx.match[1] as OrderStatus;
          const page = Number(ctx.match[2] ?? 1);
          const ordersByStatus = await this.ordersService.getOrderByStatus(
            status,
            page,
          );

          const text = formatActiveOrdersMessage(
            status,
            ordersByStatus.orders,
            page,
            ordersByStatus.totalPages,
          );

          await ctx.editMessageText(text, {
            parse_mode: 'HTML',
            ...getActiveOrdersKeyboard(
              ordersByStatus.orders,
              status,
              page,
              ordersByStatus.totalPages,
            ),
          });

          await ctx.answerCbQuery('Список статусов заказов обновлен');
        } catch (error: unknown) {
          if (error instanceof TelegramError) {
            this.logger.error(
              `Не удалось обновить список заказов в Telegram: ${error.code}`,
            );
          }

          await ctx.reply(
            '⚠️ Не удалось загрузить список заказов. Попробуйте ещё раз.',
          );
        }
      },
    );

    this.bot.action('active:back', async (ctx) => {
      if (!this.isAdmin(ctx)) {
        ctx.answerCbQuery('Недостаточно прав');
        return;
      }

      await ctx.answerCbQuery('Список заказов обновлен');
      await this.sendActiveOrdersMenu(ctx, 'edit');
    });

    this.bot.action(
      /^active:order:(PENDING|PREPARING|READY):([1-9]\d*):([1-9]\d*)$/,
      async (ctx) => {
        if (!this.isAdmin(ctx)) {
          await ctx.answerCbQuery('Недостаточно прав');
          return;
        }

        const originStatus = ctx.match[1] as OrderStatus;
        const originPage = Number(ctx.match[2]);
        const orderId = Number(ctx.match[3]);

        if (
          !Number.isSafeInteger(orderId) ||
          !Number.isSafeInteger(originPage)
        ) {
          await ctx.answerCbQuery('Использован некорректный ID');
          return;
        }

        try {
          const text =
            await this.ordersService.getOrderNotificationMessage(orderId);

          const status = await this.ordersService.getStatusByOrderId(orderId);
          const keyboard = getActiveOrderKeyboard(
            orderId,
            status,
            originStatus,
            originPage,
          );

          await ctx.editMessageText(text, {
            parse_mode: 'HTML',
            ...keyboard,
          });

          await ctx.answerCbQuery('Заказ успешно обработан');
        } catch (error: unknown) {
          if (error instanceof NotFoundException) {
            await ctx.answerCbQuery(
              'Не удалось обработать заказ, возможно заказ не был найден',
            );
            return;
          }

          if (error instanceof ConflictException) {
            await ctx.answerCbQuery(
              'Не удалось обработать заказ, возможно заказ уже обработан или обрабатывается',
            );
            return;
          }

          if (error instanceof TelegramError) {
            this.logger.error(`Не удалось обработать заказ - ${error.code}`);
          }

          await ctx.answerCbQuery('Произошла неизвестная ошибка');
        }
      },
    );

    this.bot.command('active', async (ctx) => {
      if (!this.isAdmin(ctx)) {
        await ctx.reply('Недостаточно прав для использования этой команды');
        return;
      }

      await this.sendActiveOrdersMenu(ctx, 'reply');
    });
  }

  private async updateOrderMessage(
    ctx: Context,
    orderId: number,
    status: OrderStatus,
    originStatus?: OrderStatus,
    originPage?: number,
  ): Promise<boolean> {
    try {
      const message =
        await this.ordersService.getOrderNotificationMessage(orderId);

      const keyboard =
        !originStatus || !originPage
          ? getOrderKeyboard(orderId, status)
          : getActiveOrderKeyboard(orderId, status, originStatus, originPage);

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        ...keyboard,
      });

      return true;
    } catch (error: unknown) {
      if (error instanceof TelegramError) {
        this.logger.warn(`Message edit failed: ${error.code}`);
      } else {
        this.logger.error('Unexpected message update error');
      }

      return false;
    }
  }

  private isAdmin(ctx: Context): boolean {
    const adminIds = (process.env.TELEGRAM_ADMIN_IDS ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    return adminIds.includes(String(ctx.from?.id));
  }

  private async sendActiveOrdersMenu(
    ctx: Context,
    mode: 'reply' | 'edit' = 'reply',
  ) {
    const stats = await this.ordersService.getOrderStats();

    const buttons = stats.map((stat) => {
      const label = `${getOrderStatusLabel(stat[0])}: ${stat[1]}`;
      const callbackData = `active:status:${stat[0]}`;

      return [Markup.button.callback(label, callbackData)];
    });

    const total = stats.reduce((sum, [, count]) => sum + count, 0);

    const text =
      total === 0
        ? [
            '☕ <b>MAVELLA | Управление заказами</b>',
            '',
            '✅ <b>Активных заказов нет</b>',
            '',
            'На данный момент нет заказов, требующих обработки.',
          ].join('\n')
        : [
            '☕ <b>MAVELLA | Управление заказами</b>',
            '',
            `🗒️ Активных заказов: <b>${total}</b>`,
            '',
            'Выберите категорию, чтобы просмотреть заказы.',
          ].join('\n');

    const options = {
      parse_mode: 'HTML' as const,
      ...(total > 0 ? Markup.inlineKeyboard(buttons) : []),
    };

    if (mode === 'reply') {
      await ctx.reply(text, options);
    } else {
      await ctx.editMessageText(text, options);
    }
  }
}

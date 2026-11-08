import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../prisma/generated/prisma/client.js';
import type { CreateOrderSchema } from './dto/create-order.schema.js';
import type {
  CreateOrderItem,
  CalculatedOrderItem,
  CalculatedOrder,
} from '@coffee-app/contracts';
import { createHash } from 'node:crypto';
import { TelegramService } from '../telegram/telegram.service.js';
import { SavedOrderWithItems } from './types/order.notififcation.type.js';
import { formatOrderMessage } from './formatters/format.order.message.js';

const productInclude = {
  modifiers: {
    include: {
      modifier: {
        include: {
          modifierOptions: true,
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

type ProductWithModifiers = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  private readonly logger = new Logger();

  async createOrder(dto: CreateOrderSchema) {
    const requestHash = this.createRequestHash(dto);

    const existingOrder = await this.prismaService.order.findUnique({
      where: {
        idempotencyKey: dto.idempotencyKey,
      },
    });

    if (existingOrder) {
      if (existingOrder.requestHash === requestHash) {
        return existingOrder;
      }

      throw new ConflictException(
        'Запрос с таким ключом идемпотентности уже обрабатывается или был обработан',
      );
    }

    const products = await this.loadProducts(dto.items);
    const productsMap = new Map<number, ProductWithModifiers>(
      products.map((product) => [product.id, product]),
    );

    this.validateOrderItems(dto.items, productsMap);

    const calculatedOrder = this.calculateOrder(dto.items, productsMap);

    try {
      const order = await this.saveOrder(dto, calculatedOrder, requestHash);

      await this.notifyAboutOrder(order);

      return order;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        error.meta?.target.includes('idempotencyKey')
      ) {
        const existingOrder = await this.prismaService.order.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
        });

        if (existingOrder) {
          if (existingOrder.requestHash === requestHash) {
            return existingOrder;
          }

          throw new ConflictException(
            'Ключ идемпотентности уже использован для другого заказа',
          );
        }
      }

      throw error;
    }
  }

  private async loadProducts(items: CreateOrderItem[]) {
    const productsIds = [...new Set(items.map((item) => item.productId))];
    const products = await this.prismaService.product.findMany({
      where: {
        id: { in: productsIds },
        isActive: true,
      },
      include: productInclude,
    });

    if (products.length !== productsIds.length) {
      throw new BadRequestException(
        'Некоторые товары не найдены или недоступны',
      );
    }

    return products;
  }

  private validateOrderItems(
    items: CreateOrderItem[],
    productsMap: ReadonlyMap<number, ProductWithModifiers>,
  ): void {
    for (const item of items) {
      const product = productsMap.get(item.productId);

      if (!product) {
        throw new BadRequestException('Позиция не найдена');
      }

      const availableOptionIds = new Set(
        product.modifiers.flatMap((group) => {
          return group.modifier.modifierOptions.map((option) => option.id);
        }),
      );

      const invalidOptions = item.selectedOptionIds.filter(
        (optionId) => !availableOptionIds.has(optionId),
      );

      if (invalidOptions.length > 0) {
        throw new BadRequestException('В позицию добавлены недопустимые опции');
      }

      for (const group of product.modifiers) {
        const selectedCount = group.modifier.modifierOptions.filter((option) =>
          item.selectedOptionIds.includes(option.id),
        ).length;

        if (selectedCount < group.minSelected) {
          throw new BadRequestException(
            `Минимальное количество опций для ${group.modifier.name} - ${group.minSelected}`,
          );
        }

        if (selectedCount > group.maxSelected) {
          throw new BadRequestException(
            `Максимальное количество опций для ${group.modifier.name} - ${group.maxSelected}`,
          );
        }
      }
    }
  }

  private calculateOrderItem(
    orderItem: CreateOrderItem,
    product: ProductWithModifiers,
  ): CalculatedOrderItem {
    const selectedOptions = product.modifiers.flatMap((group) =>
      group.modifier.modifierOptions
        .filter((option) => orderItem.selectedOptionIds.includes(option.id))
        .map((option) => ({
          modifierOptionId: option.id,
          modifierName: group.modifier.name,
          optionName: option.name,
          priceDeltaRub: option.priceDeltaRub,
        })),
    );

    const totalDeltaPrice = selectedOptions.reduce(
      (sum, option) => option.priceDeltaRub + sum,
      0,
    );

    return {
      productId: orderItem.productId,
      productName: product.name,
      quantity: orderItem.quantity,
      unitPriceRub: totalDeltaPrice + product.priceRub,
      options: selectedOptions,
    };
  }

  private calculateOrder(
    orderItems: CreateOrderItem[],
    productsMap: Map<number, ProductWithModifiers>,
  ): CalculatedOrder {
    const calculateOrderItems = orderItems.map((item) => {
      const product = productsMap.get(item.productId);

      if (!product) {
        throw new BadRequestException(
          `Товар с ID ${item.productId} не существует или недоступен`,
        );
      }

      return this.calculateOrderItem(item, product);
    });

    const totalPriceRub = calculateOrderItems.reduce(
      (sum, item) => item.quantity * item.unitPriceRub + sum,
      0,
    );

    return {
      totalPriceRub,
      items: calculateOrderItems,
    };
  }

  private createRequestHash(dto: CreateOrderSchema) {
    const normalizeOrder = {
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      comment: dto.comment,
      items: dto.items
        .map((item) => ({
          ...item,
          selectedOptionIds: [...item.selectedOptionIds].sort((a, b) => a - b),
        }))
        .sort((a, b) => {
          if (a.productId !== b.productId) {
            return a.productId - b.productId;
          }

          const optionsA = a.selectedOptionIds.join(', ');
          const optionsB = b.selectedOptionIds.join(', ');

          if (optionsA !== optionsB) {
            return optionsA.localeCompare(optionsB);
          }

          return a.quantity - b.quantity;
        }),
    };

    const orderItemJSON = JSON.stringify(normalizeOrder);

    return createHash('sha256').update(orderItemJSON).digest('hex');
  }

  private async saveOrder(
    dto: CreateOrderSchema,
    calculateOrder: CalculatedOrder,
    requestHash: string,
  ) {
    const order = await this.prismaService.order.create({
      data: {
        idempotencyKey: dto.idempotencyKey,
        requestHash,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        comment: dto.comment,
        totalPriceRub: calculateOrder.totalPriceRub,
        orderItems: {
          create: calculateOrder.items.map((item) => ({
            productName: item.productName,
            unitPriceRub: item.unitPriceRub,
            quantity: item.quantity,
            product: {
              connect: { id: item.productId },
            },
            orderItemOptions: {
              create: item.options.map((option) => ({
                modifierName: option.modifierName,
                optionName: option.optionName,
                priceDeltaRub: option.priceDeltaRub,
              })),
            },
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            orderItemOptions: true,
          },
        },
      },
    });

    return order;
  }

  private async notifyAboutOrder(order: SavedOrderWithItems): Promise<void> {
    try {
      const message = formatOrderMessage(order);

      this.telegramService.sendMessage(message);
    } catch (error: unknown) {
      this.logger.warn(
        `Не удалось отправить уведомление о заказе #${order.id}`,
      );
    }
  }
}

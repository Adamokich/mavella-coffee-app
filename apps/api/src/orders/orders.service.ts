import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import crypto from 'node:crypto';
import {
  Order,
  OrderStatus,
  Prisma,
} from '../prisma/generated/prisma/client.js';
import type { CreateOrderSchema } from './dto/create-order.schema.js';
import type {
  CreateOrderItem,
  CalculatedOrderItem,
  CalculatedOrder,
  CreateOrderResponse,
} from '@coffee-app/contracts';
import { createHash } from 'node:crypto';
import { TelegramService } from '../telegram/telegram.service.js';
import { OrderStatusPayload, SavedOrderWithItems } from './types/order.type.js';
import { formatOrderMessage } from '../telegram/utils/format.order.message.js';
import { getTrackingToken } from './utils/tracking-token.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

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

const orderItemsInclude = {
  orderItems: {
    include: {
      orderItemOptions: true,
    },
  },
} satisfies Prisma.OrderInclude;

type ProductWithModifiers = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly telegramService: TelegramService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private readonly logger = new Logger();

  async createOrder(dto: CreateOrderSchema): Promise<CreateOrderResponse> {
    const requestHash = this.createRequestHash(dto);
    const { trackingToken, trackingTokenHash } = getTrackingToken(
      dto.idempotencyKey,
    );

    const buildResponse = (order: Order): CreateOrderResponse => ({
      id: order.id,
      status: order.status,
      totalPriceRub: order.totalPriceRub,
      trackingToken,
    });

    const resolveExistingOrder = async (conflictMessage: string) => {
      const existingOrder = await this.prismaService.order.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });

      if (!existingOrder) return null;

      if (existingOrder.requestHash !== requestHash) {
        throw new ConflictException(conflictMessage);
      }

      if (existingOrder.trackingTokenHash !== trackingTokenHash) {
        this.logger.error(
          `Tracking token hash mismatch for order ${existingOrder.id}`,
        );
        throw new InternalServerErrorException();
      }

      return buildResponse(existingOrder);
    };

    const cachedResponse = await resolveExistingOrder(
      'Запрос с таким ключом идемпотентности уже обрабатывается или был обработан',
    );

    if (cachedResponse) return cachedResponse;

    const products = await this.loadProducts(dto.items);
    const productsMap = new Map<number, ProductWithModifiers>(
      products.map((product) => [product.id, product]),
    );

    this.validateOrderItems(dto.items, productsMap);
    const calculatedOrder = this.calculateOrder(dto.items, productsMap);

    try {
      const order = await this.saveOrder(
        dto,
        calculatedOrder,
        requestHash,
        trackingTokenHash,
      );

      console.log(trackingToken);

      await this.notifyAboutOrder(order);

      return buildResponse(order);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        error.meta?.target.includes('idempotencyKey')
      ) {
        const raceResponse = await resolveExistingOrder(
          'Ключ идемпотентности уже использован для другого заказа',
        );

        if (raceResponse) return raceResponse;
      }

      throw error;
    }
  }

  private async saveOrder(
    dto: CreateOrderSchema,
    calculateOrder: CalculatedOrder,
    requestHash: string,
    trackingTokenHash: string,
  ) {
    const order = await this.prismaService.order.create({
      data: {
        idempotencyKey: dto.idempotencyKey,
        requestHash,
        trackingTokenHash,
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

  private async notifyAboutOrder(order: SavedOrderWithItems): Promise<void> {
    try {
      const message = formatOrderMessage(order);

      await this.telegramService.sendOrderNotification(order.id, message);
    } catch (error: unknown) {
      this.logger.warn(
        `Не удалось отправить уведомление о заказе #${order.id}`,
      );
    }
  }

  async acceptOrder(orderId: number) {
    return this.changeOrderStatus(orderId, 'PENDING', 'PREPARING');
  }

  async rejectOrder(orderId: number) {
    return this.changeOrderStatus(orderId, 'PENDING', 'CANCELLED');
  }

  async markOrderReady(orderId: number) {
    return this.changeOrderStatus(orderId, 'PREPARING', 'READY');
  }

  async markOrderCompleted(orderId: number) {
    return this.changeOrderStatus(orderId, 'READY', 'COMPLETED');
  }

  private async changeOrderStatus(
    orderId: number,
    expectedStatus: OrderStatus,
    newStatus: OrderStatus,
  ) {
    const result = await this.prismaService.order.updateManyAndReturn({
      where: { id: orderId, status: expectedStatus },
      data: {
        status: newStatus,
        ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
        version: { increment: 1 },
      },
      select: {
        version: true,
        status: true,
      },
    });

    if (result.length === 0) {
      const order = await this.prismaService.order.findUnique({
        where: { id: orderId },
        select: { id: true },
      });

      if (!order) {
        throw new NotFoundException('Заказ с таким номером не найден');
      }

      throw new ConflictException('Заказ уже обработан или не существует');
    }

    const { status, version } = result[0];

    this.eventEmitter.emit('order.status.changed', {
      orderId,
      status,
      version,
    });

    return {
      success: true,
      orderId,
      status,
      version,
    };
  }

  async getOrderNotificationMessage(orderId: number) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: orderItemsInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return formatOrderMessage(order);
  }

  async getOrderStats(): Promise<[OrderStatus, number][]> {
    const counts = new Map<OrderStatus, number>([
      ['PENDING', 0],
      ['PREPARING', 0],
      ['READY', 0],
    ]);

    const ordersStatusGroup = await this.prismaService.order.groupBy({
      by: ['status'],
      where: {
        status: {
          in: ['PREPARING', 'READY', 'PENDING'],
        },
      },
      _count: {
        _all: true,
      },
    });

    for (const group of ordersStatusGroup) {
      counts.set(group.status, group._count._all);
    }

    return [...counts];
  }

  async getOrderByStatus(status: OrderStatus, page: number = 1) {
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new BadRequestException('Некорректный номер страницы');
    }

    const total = await this.prismaService.order.count({
      where: { status },
    });

    const totalPages = Math.ceil(total / 5);

    const result = await this.prismaService.order.findMany({
      where: {
        status,
      },
      orderBy: [{ id: 'asc' }, { createdAt: 'asc' }],
      select: {
        createdAt: true,
        id: true,
      },
      take: 5,
      skip: (page - 1) * 5,
    });

    return {
      orders: result,
      page,
      total,
      totalPages,
    };
  }

  async getStatusByOrderId(orderId: number): Promise<OrderStatus> {
    const orderStatus = await this.prismaService.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!orderStatus) {
      throw new NotFoundException('Заказ с таким номером не найден');
    }

    return orderStatus.status;
  }

  async getOrderStatus(
    orderId: number,
    trackingToken: string | undefined,
  ): Promise<OrderStatusPayload> {
    if (!trackingToken) {
      throw new UnauthorizedException('Во входящем запросе отсутствует токен');
    }

    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        trackingTokenHash: true,
        status: true,
        version: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        `Не удалось получить данные о заказе или статусе`,
      );
    }

    const incomingTokenHash = crypto
      .createHash('sha256')
      .update(trackingToken)
      .digest('hex');

    const storedHashBuffer = Buffer.from(order.trackingTokenHash, 'hex');
    const incomingHashBuffer = Buffer.from(incomingTokenHash, 'hex');

    const isValid =
      storedHashBuffer.length === incomingHashBuffer.length &&
      crypto.timingSafeEqual(incomingHashBuffer, storedHashBuffer);

    if (!isValid) {
      throw new NotFoundException(
        `Не удалось получить данные о заказе или статусе`,
      );
    }

    return { orderId: order.id, status: order.status, version: order.version };
  }
}

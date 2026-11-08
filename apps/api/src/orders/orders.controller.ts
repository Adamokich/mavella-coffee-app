import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import {
  createOrderSchema,
  type CreateOrderSchema,
} from './dto/create-order.schema.js';
import {} from '@standard-schema/spec';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body({ schema: createOrderSchema }) dto: CreateOrderSchema) {
    return this.ordersService.createOrder(dto);
  }
}

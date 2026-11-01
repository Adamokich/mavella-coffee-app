import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProductService } from './product.service.js';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get(':id/modifiers')
  findProductModifiers(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findProductModifiers(id);
  }
}

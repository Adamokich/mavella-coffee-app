import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

  async findProductModifiers(id: number) {
    const product = await this.prismaService.product.findUnique({
      where: { id },
      include: {
        modifiers: {
          include: {
            modifier: {
              include: {
                modifierOptions: true,
              },
            },
            defaultOption: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Позиция с id ${id} не найден`);
    }

    return product;
  }
}

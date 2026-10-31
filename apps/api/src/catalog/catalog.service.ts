import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CatalogService {
  constructor(private readonly prismaService: PrismaService) {}

  async findCatalog() {
    return this.prismaService.category.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        products: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });
  }
}

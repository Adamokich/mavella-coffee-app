import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL_LOCAL;

    if (!connectionString) {
      throw new Error('DATABASE_URL_LOCAL is not defined');
    }

    super({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

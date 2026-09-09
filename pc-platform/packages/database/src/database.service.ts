import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from './generated';

/**
 * DatabaseService — NestJS injectable Prisma client.
 *
 * This is the ONLY way NestJS services should access the database.
 * Never inject PrismaClient directly. Always use DatabaseService.
 *
 * This abstraction ensures:
 *   1. Clean lifecycle management (connect/disconnect)
 *   2. A single place to add middleware (logging, soft deletes, etc.)
 *   3. Easy mocking in tests
 */
@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    super({
      log:
        process.env['NODE_ENV'] === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (err) {
      this.logger.warn(
        `Database connection could not be established on startup: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    } catch (err) {
      this.logger.warn(
        `Error disconnecting database: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

import { Module } from '@nestjs/common';

import { CacheModule } from '../common/cache/cache.module';
import { StorageModule } from '../storage/storage.module';

import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  imports: [CacheModule, StorageModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}

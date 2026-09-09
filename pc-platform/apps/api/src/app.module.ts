/**
 * AppModule — Root NestJS Module
 *
 * Imports all feature modules. Feature modules are isolated
 * by domain — each owns its controller, service, and DTO.
 *
 * Adding a new domain:
 *   1. Create src/<domain>/<domain>.module.ts
 *   2. Import it here in the imports array
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';

import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { InventoryModule } from './inventory/inventory.module';
import { PricesModule } from './prices/prices.module';
import { BuildsModule } from './builds/builds.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { RolesModule } from './roles/roles.module';
import { SearchModule } from './search/search.module';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './database/database.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { CacheModule } from './common/cache/cache.module';

@Module({
  imports: [
    // ── Config ────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true, // No need to import ConfigModule in feature modules
      envFilePath: ['.env.local', '.env'],
    }),

    // ── Rate Limiting ─────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60_000, // 1 minute
        limit: 100,
      },
    ]),

    // ── HTTP Client (for calling compatibility engine) ─────────
    HttpModule,

    // ── Database & Cache ──────────────────────────────────────
    DatabaseModule,
    CacheModule,

    // ── Feature Modules ───────────────────────────────────────
    HealthModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    InventoryModule,
    PricesModule,
    BuildsModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    WishlistModule,
    RolesModule,
    SearchModule,
    AdminModule,
    AuditLogsModule,
  ],
})
export class AppModule {}

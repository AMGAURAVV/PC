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

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AdminModule } from './admin/admin.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthModule } from './auth/auth.module';
import { BrandsModule } from './brands/brands.module';
import { BuildsModule } from './builds/builds.module';
import { CartModule } from './cart/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { CacheModule } from './common/cache/cache.module';
import { CommunityModule } from './community/community.module';
import { ConfiguratorModule } from './configurator/configurator.module';
import { CouponsModule } from './coupons/coupons.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PricesModule } from './prices/prices.module';
import { ProductsModule } from './products/products.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RolesModule } from './roles/roles.module';
import { SearchModule } from './search/search.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { WishlistModule } from './wishlist/wishlist.module';

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
    ConfiguratorModule,
    RecommendationsModule,
    CouponsModule,
    PaymentsModule,
    StorageModule,
    CommunityModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

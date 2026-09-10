import { Module } from '@nestjs/common';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CacheModule } from '../common/cache/cache.module';
import { CommunityModule } from '../community/community.module';
import { DatabaseModule } from '../database/database.module';

// Central Audit Service
import { StorageModule } from '../storage/storage.module';

import { AdminAuditService } from './admin-audit.service';

// Controllers
import { AdminController } from './admin.controller';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';
import { AdminAuditLogsController } from './controllers/admin-audit-logs.controller';
import { AdminBrandsController } from './controllers/admin-brands.controller';
import { AdminCategoriesController } from './controllers/admin-categories.controller';
import { AdminCmsController } from './controllers/admin-cms.controller';
import { AdminCommunityController } from './controllers/admin-community.controller';
import { AdminCompatibilityController } from './controllers/admin-compatibility.controller';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminInventoryController } from './controllers/admin-inventory.controller';
import { AdminOrdersController } from './controllers/admin-orders.controller';
import { AdminPricesController } from './controllers/admin-prices.controller';
import { AdminProductsController } from './controllers/admin-products.controller';
import { AdminReviewsController } from './controllers/admin-reviews.controller';
import { AdminTemplatesController } from './controllers/admin-templates.controller';
import { AdminUsersController } from './controllers/admin-users.controller';

// Services
import { AdminAuditLogsService } from './services/admin-audit-logs.service';
import { AdminBrandsService } from './services/admin-brands.service';
import { AdminCategoriesService } from './services/admin-categories.service';
import { AdminCmsService } from './services/admin-cms.service';
import { AdminCommunityService } from './services/admin-community.service';
import { AdminCompatibilityService } from './services/admin-compatibility.service';
import { AdminCouponsService } from './services/admin-coupons.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminInventoryService } from './services/admin-inventory.service';
import { AdminOrdersService } from './services/admin-orders.service';
import { AdminPricesService } from './services/admin-prices.service';
import { AdminProductsService } from './services/admin-products.service';
import { AdminReviewsService } from './services/admin-reviews.service';
import { AdminTemplatesService } from './services/admin-templates.service';
import { AdminUsersService } from './services/admin-users.service';


@Module({
  imports: [DatabaseModule, CacheModule, AuditLogsModule, StorageModule, CommunityModule],
  controllers: [
    AdminController,
    AdminProductsController,
    AdminCategoriesController,
    AdminBrandsController,
    AdminInventoryController,
    AdminPricesController,
    AdminCompatibilityController,
    AdminTemplatesController,
    AdminCouponsController,
    AdminOrdersController,
    AdminUsersController,
    AdminReviewsController,
    AdminCmsController,
    AdminAuditLogsController,
    AdminDashboardController,
    AdminCommunityController,
  ],
  providers: [
    AdminAuditService,
    AdminService,
    AdminRepository,
    AdminProductsService,
    AdminCategoriesService,
    AdminBrandsService,
    AdminInventoryService,
    AdminPricesService,
    AdminCompatibilityService,
    AdminTemplatesService,
    AdminCouponsService,
    AdminOrdersService,
    AdminUsersService,
    AdminReviewsService,
    AdminCmsService,
    AdminAuditLogsService,
    AdminDashboardService,
    AdminCommunityService,
  ],
  exports: [
    AdminAuditService,
    AdminProductsService,
    AdminCategoriesService,
    AdminBrandsService,
    AdminInventoryService,
    AdminPricesService,
    AdminCompatibilityService,
    AdminTemplatesService,
    AdminCouponsService,
    AdminOrdersService,
    AdminUsersService,
    AdminReviewsService,
    AdminCmsService,
    AdminAuditLogsService,
    AdminDashboardService,
    AdminCommunityService,
  ],
})
export class AdminModule {}

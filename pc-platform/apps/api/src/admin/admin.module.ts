import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../common/cache/cache.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

// Central Audit Service
import { AdminAuditService } from './admin-audit.service';

// Controllers
import { AdminController } from './admin.controller';
import { AdminProductsController } from './controllers/admin-products.controller';
import { AdminCategoriesController } from './controllers/admin-categories.controller';
import { AdminBrandsController } from './controllers/admin-brands.controller';
import { AdminInventoryController } from './controllers/admin-inventory.controller';
import { AdminPricesController } from './controllers/admin-prices.controller';
import { AdminCompatibilityController } from './controllers/admin-compatibility.controller';
import { AdminTemplatesController } from './controllers/admin-templates.controller';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { AdminOrdersController } from './controllers/admin-orders.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminReviewsController } from './controllers/admin-reviews.controller';
import { AdminCmsController } from './controllers/admin-cms.controller';
import { AdminAuditLogsController } from './controllers/admin-audit-logs.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';

// Services
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { AdminProductsService } from './services/admin-products.service';
import { AdminCategoriesService } from './services/admin-categories.service';
import { AdminBrandsService } from './services/admin-brands.service';
import { AdminInventoryService } from './services/admin-inventory.service';
import { AdminPricesService } from './services/admin-prices.service';
import { AdminCompatibilityService } from './services/admin-compatibility.service';
import { AdminTemplatesService } from './services/admin-templates.service';
import { AdminCouponsService } from './services/admin-coupons.service';
import { AdminOrdersService } from './services/admin-orders.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminReviewsService } from './services/admin-reviews.service';
import { AdminCmsService } from './services/admin-cms.service';
import { AdminAuditLogsService } from './services/admin-audit-logs.service';
import { AdminDashboardService } from './services/admin-dashboard.service';

@Module({
  imports: [DatabaseModule, CacheModule, AuditLogsModule],
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
  ],
})
export class AdminModule {}

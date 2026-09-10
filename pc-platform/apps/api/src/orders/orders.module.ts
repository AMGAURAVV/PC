import { Module } from '@nestjs/common';
import { CompatibilityModule } from '@pc-platform/compatibility-engine';

import { CartModule } from '../cart/cart.module';
import { CouponsModule } from '../coupons/coupons.module';
import { PaymentsModule } from '../payments/payments.module';

import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';


@Module({
  imports: [CartModule, CouponsModule, PaymentsModule, CompatibilityModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}

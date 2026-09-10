import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { PAYMENT_PROVIDER_TOKEN } from './interfaces/payment-provider.interface';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MockPaymentProvider,
    {
      provide: PAYMENT_PROVIDER_TOKEN,
      useExisting: MockPaymentProvider,
    },
  ],
  exports: [PaymentsService, PAYMENT_PROVIDER_TOKEN],
})
export class PaymentsModule {}

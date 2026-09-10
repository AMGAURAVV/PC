import { Module } from '@nestjs/common';

import { PricesController } from './prices.controller';
import { PricesRepository } from './prices.repository';
import { PricesService } from './prices.service';

@Module({
  imports: [],
  controllers: [PricesController],
  providers: [PricesService, PricesRepository],
  exports: [PricesService],
})
export class PricesModule {}

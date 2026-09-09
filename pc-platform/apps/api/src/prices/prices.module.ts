import { Module } from '@nestjs/common';
import { PricesController } from './prices.controller';
import { PricesService } from './prices.service';
import { PricesRepository } from './prices.repository';

@Module({
  imports: [],
  controllers: [PricesController],
  providers: [PricesService, PricesRepository],
  exports: [PricesService],
})
export class PricesModule {}

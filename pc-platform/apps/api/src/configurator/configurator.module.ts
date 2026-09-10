import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { ConfiguratorController } from './configurator.controller';
import { ConfiguratorService } from './configurator.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ConfiguratorController],
  providers: [ConfiguratorService],
  exports: [ConfiguratorService],
})
export class ConfiguratorModule {}

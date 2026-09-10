import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { BuildsController } from './builds.controller';
import { BuildsRepository } from './builds.repository';
import { BuildsService } from './builds.service';
import { CompatibilityClientService } from './compatibility-client.service';
import { SharedBuildsController } from './shared-builds.controller';

@Module({
  imports: [HttpModule],
  controllers: [BuildsController, SharedBuildsController],
  providers: [BuildsService, BuildsRepository, CompatibilityClientService],
  exports: [BuildsService, BuildsRepository, CompatibilityClientService],
})
export class BuildsModule {}

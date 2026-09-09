import { Module } from '@nestjs/common';
import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';
import { BuildsRepository } from './builds.repository';

@Module({
  imports: [],
  controllers: [BuildsController],
  providers: [BuildsService, BuildsRepository],
  exports: [BuildsService],
})
export class BuildsModule {}

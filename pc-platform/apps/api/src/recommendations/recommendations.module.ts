import { Module } from '@nestjs/common';
import { RecommendationModule } from '@pc-platform/recommendation-engine';

import { DatabaseModule } from '../database/database.module';

import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [DatabaseModule, RecommendationModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}

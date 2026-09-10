import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { ApiResponse, RecommendationResult } from '@pc-platform/types';

import { Public } from '../common/decorators/public.decorator';

import type { RecommendationRequestDto } from './dto/recommendation-request.dto';
import type { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async getRecommendation(
    @Body() dto: RecommendationRequestDto,
  ): Promise<ApiResponse<RecommendationResult>> {
    const data = await this.recommendationsService.generateRecommendation(dto);
    return { success: true, data };
  }
}

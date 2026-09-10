import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RecommendationInput, RecommendationResult } from '@pc-platform/types';
import { RecommendationService } from './recommendation.service';
import { HardwarePool } from './domain/interfaces';

export class RecommendationRequestDto {
  input!: RecommendationInput;
  candidates!: HardwarePool;
}

@Controller('recommend')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  public async getRecommendation(
    @Body() dto: RecommendationRequestDto,
  ): Promise<RecommendationResult> {
    return this.recommendationService.getRecommendation(dto.input, dto.candidates);
  }
}

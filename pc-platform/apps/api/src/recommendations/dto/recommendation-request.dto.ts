import type {
  RecommendationInput,
  ResolutionTarget,
  RgbPreference,
  UpgradePreference,
} from '@pc-platform/types';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class RecommendationRequestDto implements RecommendationInput {
  @IsNumber()
  @Min(20000, { message: 'Budget must be at least ₹20,000' })
  budget!: number;

  @IsString()
  useCase!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredGames?: string[];

  @IsOptional()
  @IsIn(['1080p', '1440p', '4k'])
  resolution?: ResolutionTarget;

  @IsOptional()
  @IsInt()
  @Min(30)
  targetFps?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  creatorApplications?: string[];

  @IsOptional()
  @IsBoolean()
  streamingRequirement?: boolean;

  @IsOptional()
  @IsInt()
  @Min(250)
  storageRequirement?: number;

  @IsOptional()
  @IsBoolean()
  wifiRequirement?: boolean;

  @IsOptional()
  @IsIn(['none', 'subtle', 'maximum'])
  rgbPreference?: RgbPreference;

  @IsOptional()
  @IsIn(['immediate_value', 'future_upgradeability', 'balanced'])
  upgradePreference?: UpgradePreference;
}

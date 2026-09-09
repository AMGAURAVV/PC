import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { AdminPaginationDto } from './admin-common.dto';

export enum AdminReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

export class AdminReviewFilterDto extends AdminPaginationDto {
  @ApiPropertyOptional({ enum: AdminReviewStatus })
  @IsOptional()
  @IsEnum(AdminReviewStatus)
  status?: AdminReviewStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class ModerateReviewDto {
  @ApiProperty({ enum: AdminReviewStatus, example: AdminReviewStatus.APPROVED })
  @IsEnum(AdminReviewStatus)
  status!: AdminReviewStatus;

  @ApiPropertyOptional({ example: 'Review adheres to community guidelines' })
  @IsOptional()
  @IsString()
  moderatorNote?: string | undefined;
}

export class BulkModerateReviewsDto {
  @ApiProperty({ example: ['review-uuid-1', 'review-uuid-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  reviewIds!: string[];

  @ApiProperty({ enum: AdminReviewStatus, example: AdminReviewStatus.APPROVED })
  @IsEnum(AdminReviewStatus)
  status!: AdminReviewStatus;

  @ApiPropertyOptional({ example: 'Bulk approved batch' })
  @IsOptional()
  @IsString()
  moderatorNote?: string | undefined;
}

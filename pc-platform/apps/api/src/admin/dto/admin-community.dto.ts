import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModerationStatus } from '@pc-platform/database';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { AdminPaginationDto } from './admin-common.dto';

export class AdminCommunityFilterDto extends AdminPaginationDto {
  @ApiPropertyOptional({ enum: ModerationStatus })
  @IsOptional()
  @IsEnum(ModerationStatus)
  status?: ModerationStatus;

  @ApiPropertyOptional({ example: 'Gaming' })
  @IsOptional()
  @IsString()
  useCase?: string;
}

export class ModerateCommunityBuildDto {
  @ApiProperty({
    enum: ['approve', 'hide', 'remove', 'feature', 'unfeature'],
    example: 'approve',
  })
  @IsString()
  action!: 'approve' | 'hide' | 'remove' | 'feature' | 'unfeature';

  @ApiPropertyOptional({ example: 'Verified genuine benchmark and specs.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ResolveCommunityReportDto {
  @ApiProperty({
    enum: ['DISMISSED', 'ACTIONED'],
    example: 'ACTIONED',
  })
  @IsString()
  status!: 'DISMISSED' | 'ACTIONED';

  @ApiPropertyOptional({ example: 'Build has been hidden due to misleading specs.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

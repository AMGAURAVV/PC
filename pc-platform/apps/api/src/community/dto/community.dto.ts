import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityReportReason } from '@pc-platform/database';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class QueryCommunityBuildsDto {
  @ApiPropertyOptional({ enum: ['featured', 'latest', 'popular', 'price_asc', 'price_desc'] })
  @IsOptional()
  @IsString()
  sort?: 'featured' | 'latest' | 'popular' | 'price_asc' | 'price_desc';

  @ApiPropertyOptional({ example: 'Gaming' })
  @IsOptional()
  @IsString()
  useCase?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({ example: 'RTX 4080' })
  @IsOptional()
  @IsString()
  gpu?: string;

  @ApiPropertyOptional({ example: 'Ryzen 7 7800X3D' })
  @IsOptional()
  @IsString()
  cpu?: string;

  @ApiPropertyOptional({ example: 'Cyberpunk' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}

export class PublishCommunityBuildDto {
  @ApiProperty({ example: 'Cyberpunk Aurora Ultra' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Built for 4K ray tracing and high-fps streaming.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Gaming' })
  @IsOptional()
  @IsString()
  useCase?: string;

  @ApiPropertyOptional({ example: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: 'build-uuid' })
  @IsOptional()
  @IsUUID()
  buildId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  components?: any[];

  @ApiPropertyOptional({ example: 185000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalPrice?: number;

  @ApiPropertyOptional({ example: 'AMD Ryzen 7 7800X3D' })
  @IsOptional()
  @IsString()
  cpuName?: string;

  @ApiPropertyOptional({ example: 'NVIDIA GeForce RTX 4080 Super' })
  @IsOptional()
  @IsString()
  gpuName?: string;

  @ApiPropertyOptional({ example: 'MSI MAG B650 TOMAHAWK WIFI' })
  @IsOptional()
  @IsString()
  motherboardName?: string;

  @ApiPropertyOptional({ example: '32GB (2x16GB) DDR5-6000 CL30' })
  @IsOptional()
  @IsString()
  ramInfo?: string;

  @ApiPropertyOptional({ example: '2TB NVMe Gen4 SSD' })
  @IsOptional()
  @IsString()
  storageInfo?: string;

  @ApiPropertyOptional({ example: 'Lian Li O11 Dynamic EVO' })
  @IsOptional()
  @IsString()
  caseName?: string;

  @ApiPropertyOptional({ example: 'Corsair RM850x 850W Gold' })
  @IsOptional()
  @IsString()
  psuInfo?: string;

  @ApiPropertyOptional({ example: 'DeepCool LT720 360mm AIO' })
  @IsOptional()
  @IsString()
  coolerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  compatibilitySummary?: any;
}

export class AddCommunityCommentDto {
  @ApiProperty({ example: 'Incredible cable management! What temps are you getting under FurMark?' })
  @IsString()
  content!: string;
}

export class ReportCommunityBuildDto {
  @ApiProperty({ enum: CommunityReportReason })
  @IsEnum(CommunityReportReason)
  reason!: CommunityReportReason;

  @ApiPropertyOptional({ example: 'This build lists fake RTX 4090 benchmark speeds.' })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsString()
  reporterEmail?: string;
}

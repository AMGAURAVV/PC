import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { AdminPaginationDto } from './admin-common.dto';

export class AdminCategoryFilterDto extends AdminPaginationDto {
  @ApiPropertyOptional({ description: 'Filter by parent category ID' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class AdminCreateCategoryDto {
  @ApiProperty({ example: 'Graphics Cards' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'graphics-cards' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Desktop gaming and workstation graphics cards' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'cat-parent-uuid' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminUpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Graphics Cards' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'graphics-cards' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminReorderCategoryItemDto {
  @ApiProperty({ example: 'cat-uuid' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class AdminReorderCategoriesDto {
  @ApiProperty({ type: [AdminReorderCategoryItemDto] })
  @IsArray()
  items!: AdminReorderCategoryItemDto[];
}

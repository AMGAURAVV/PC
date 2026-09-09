import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Processors' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Desktop CPUs' })
  @IsOptional()
  @IsString()
  description?: string | undefined;

  @ApiPropertyOptional({ example: 'https://images.pcplatform.com/categories/cpus.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string | undefined;

  @ApiPropertyOptional({ example: 'uuid-parent-category' })
  @IsOptional()
  @IsUUID()
  parentId?: string | undefined;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Processors' })
  @IsOptional()
  @IsString()
  name?: string | undefined;

  @ApiPropertyOptional({ example: 'Desktop CPUs' })
  @IsOptional()
  @IsString()
  description?: string | undefined;

  @ApiPropertyOptional({ example: 'https://images.pcplatform.com/categories/cpus.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string | undefined;

  @ApiPropertyOptional({ example: 'uuid-parent-category' })
  @IsOptional()
  @IsUUID()
  parentId?: string | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean | undefined;
}

export class CategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  description?: string | null | undefined;

  @ApiPropertyOptional()
  imageUrl?: string | null | undefined;

  @ApiPropertyOptional()
  parentId?: string | null | undefined;

  @ApiPropertyOptional({ example: 42 })
  productCount?: number | undefined;

  @ApiPropertyOptional({ type: () => [CategoryResponseDto] })
  children?: CategoryResponseDto[] | undefined;
}

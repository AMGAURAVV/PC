import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'AMD' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Advanced Micro Devices, Inc.' })
  @IsOptional()
  @IsString()
  description?: string | undefined;

  @ApiPropertyOptional({ example: 'https://images.pcplatform.com/brands/amd.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string | undefined;

  @ApiPropertyOptional({ example: 'https://www.amd.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string | undefined;
}

export class UpdateBrandDto {
  @ApiPropertyOptional({ example: 'AMD' })
  @IsOptional()
  @IsString()
  name?: string | undefined;

  @ApiPropertyOptional({ example: 'Advanced Micro Devices, Inc.' })
  @IsOptional()
  @IsString()
  description?: string | undefined;

  @ApiPropertyOptional({ example: 'https://images.pcplatform.com/brands/amd.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string | undefined;

  @ApiPropertyOptional({ example: 'https://www.amd.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean | undefined;
}

export class BrandResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  description?: string | null | undefined;

  @ApiPropertyOptional()
  logoUrl?: string | null | undefined;

  @ApiPropertyOptional()
  websiteUrl?: string | null | undefined;

  @ApiPropertyOptional({ example: 28 })
  productCount?: number | undefined;

  @ApiProperty()
  isActive!: boolean;
}

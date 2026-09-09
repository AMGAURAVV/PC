import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class BuildItemDto {
  @ApiProperty({ example: 'uuid-product' })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ example: 'uuid-variant' })
  @IsOptional()
  @IsUUID()
  productVariantId?: string;
}

export class CreateBuildDto {
  @ApiProperty({ example: 'My Gaming Rig' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'High-end 1440p gaming PC' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [BuildItemDto] })
  @IsArray()
  items!: BuildItemDto[];
}

export class UpdateBuildDto {
  @ApiPropertyOptional({ example: 'My Updated Gaming Rig' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'High-end 1440p gaming PC' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class BuildResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: [BuildItemDto] })
  items!: BuildItemDto[];

  @ApiProperty()
  totalEstimatedPrice!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

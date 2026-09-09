import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateInventoryDto {
  @ApiProperty({ example: 'uuid-product' })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ example: 'uuid-variant' })
  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ example: 'MAIN_WAREHOUSE' })
  @IsOptional()
  location?: string;
}

export class UpdateInventoryDto {
  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  quantity?: number;

  @ApiPropertyOptional({ example: 'MAIN_WAREHOUSE' })
  @IsOptional()
  location?: string;
}

export class InventoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional()
  productVariantId?: string;

  @ApiProperty()
  quantity!: number;

  @ApiPropertyOptional()
  location?: string;

  @ApiProperty()
  lastUpdated!: string;
}

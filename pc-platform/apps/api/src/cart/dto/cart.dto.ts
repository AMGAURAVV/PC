import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 'uuid-product' })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ example: 'uuid-variant' })
  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CartItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional()
  productVariantId?: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  priceAtAdded!: number;

  @ApiPropertyOptional()
  productName?: string;

  @ApiPropertyOptional()
  brandName?: string;

  @ApiPropertyOptional()
  unitPrice?: number;

  @ApiPropertyOptional()
  totalPrice?: number;

  @ApiPropertyOptional()
  inStock?: boolean;
}

export class CartResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items!: CartItemResponseDto[];

  @ApiProperty()
  updatedAt!: string;
}

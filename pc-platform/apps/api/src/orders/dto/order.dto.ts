import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-address' })
  @IsString()
  @IsNotEmpty()
  shippingAddressId!: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'SHIPPED' })
  @IsString()
  @IsNotEmpty()
  status!: string;
}

export class OrderItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional()
  productVariantId?: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  priceAtPurchase!: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  shippingAddressId!: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items!: OrderItemResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

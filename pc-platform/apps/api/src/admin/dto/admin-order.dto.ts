import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { DateRangeFilterDto } from './admin-common.dto';

export enum AdminOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  PARTIALLY_SHIPPED = 'PARTIALLY_SHIPPED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export class AdminOrderFilterDto extends DateRangeFilterDto {
  @ApiPropertyOptional({ enum: AdminOrderStatus })
  @IsOptional()
  @IsEnum(AdminOrderStatus)
  status?: AdminOrderStatus;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by customer email or order number' })
  @IsOptional()
  @IsString()
  query?: string;
}

export class AdminUpdateOrderStatusDto {
  @ApiProperty({ enum: AdminOrderStatus, example: AdminOrderStatus.PROCESSING })
  @IsEnum(AdminOrderStatus)
  status!: AdminOrderStatus;

  @ApiPropertyOptional({ example: 'Dispatched to warehouse for picking' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tracking number if shipping' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Carrier name if shipping' })
  @IsOptional()
  @IsString()
  carrier?: string;
}

export class AdminCancelOrderDto {
  @ApiProperty({ example: 'Customer requested cancellation prior to shipment' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ default: true, description: 'Whether to restore reserved/sold inventory' })
  @IsOptional()
  @IsBoolean()
  restockInventory?: boolean = true;
}

export class AdminRefundOrderDto {
  @ApiPropertyOptional({ example: 450.0, description: 'Refund amount; omits for full refund' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ example: 'Product returned in good condition' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

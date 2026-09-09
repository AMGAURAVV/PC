import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export class AuditLogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  actorId?: string;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  entityType!: string;

  @ApiPropertyOptional()
  entityId?: string;

  @ApiPropertyOptional()
  details?: any;

  @ApiProperty()
  ipAddress?: string;

  @ApiProperty()
  createdAt!: string;
}

export class DashboardSummaryDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  totalOrders!: number;

  @ApiProperty()
  totalRevenue!: number;

  @ApiProperty()
  totalProducts!: number;
}

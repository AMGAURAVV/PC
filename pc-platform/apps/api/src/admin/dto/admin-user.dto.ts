import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { AdminPaginationDto } from './admin-common.dto';

export enum AdminUserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export class AdminUserFilterDto extends AdminPaginationDto {
  @ApiPropertyOptional({ enum: AdminUserStatus })
  @IsOptional()
  @IsEnum(AdminUserStatus)
  status?: AdminUserStatus;

  @ApiPropertyOptional({ description: 'Filter by role name (e.g. admin, super_admin, customer, supplier)' })
  @IsOptional()
  @IsString()
  role?: string;
}

export class AdminUpdateUserStatusDto {
  @ApiProperty({ enum: AdminUserStatus, example: AdminUserStatus.SUSPENDED })
  @IsEnum(AdminUserStatus)
  status!: AdminUserStatus;

  @ApiPropertyOptional({ example: 'Suspended due to policy violation' })
  @IsOptional()
  @IsString()
  reason?: string | undefined;
}

export class AdminAssignRolesDto {
  @ApiProperty({ example: ['admin', 'customer'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  roleNames!: string[];
}

export class BulkUserStatusDto {
  @ApiProperty({ example: ['user-uuid-1', 'user-uuid-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  userIds!: string[];

  @ApiProperty({ enum: AdminUserStatus, example: AdminUserStatus.SUSPENDED })
  @IsEnum(AdminUserStatus)
  status!: AdminUserStatus;

  @ApiPropertyOptional({ example: 'Batch security review cleanup' })
  @IsOptional()
  @IsString()
  reason?: string | undefined;
}

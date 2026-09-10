import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '@pc-platform/database';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAuditLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  actorId?: string | undefined;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorEmail?: string | undefined;

  @ApiProperty({ enum: AuditAction })
  @IsEnum(AuditAction)
  action!: AuditAction;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityId?: string | undefined;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityLabel?: string | undefined;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  before?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  after?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string | undefined;
}

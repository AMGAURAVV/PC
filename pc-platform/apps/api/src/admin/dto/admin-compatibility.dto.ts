import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AdminPaginationDto } from './admin-common.dto';

export enum CompatibilityRuleType {
  SOCKET_MATCH = 'SOCKET_MATCH',
  CHIPSET_COMPATIBLE = 'CHIPSET_COMPATIBLE',
  DIMENSION_CLEARANCE = 'DIMENSION_CLEARANCE',
  POWER_ENOUGH = 'POWER_ENOUGH',
  MEMORY_TYPE_MATCH = 'MEMORY_TYPE_MATCH',
  FORM_FACTOR_MATCH = 'FORM_FACTOR_MATCH',
  INTERFACE_MATCH = 'INTERFACE_MATCH',
  SLOT_AVAILABILITY = 'SLOT_AVAILABILITY',
  COOLER_SOCKET_MATCH = 'COOLER_SOCKET_MATCH',
  CUSTOM = 'CUSTOM',
}

export enum CompatibilitySeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  NOTE = 'NOTE',
}

export class CreateRuleConditionDto {
  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  conditionIndex!: number;

  @ApiProperty({ example: 'CPU' })
  @IsString()
  @IsNotEmpty()
  componentType!: string;

  @ApiProperty({ example: 'socketType' })
  @IsString()
  @IsNotEmpty()
  attributePath!: string;

  @ApiProperty({ example: 'EQUALS' })
  @IsString()
  @IsNotEmpty()
  operator!: string;

  @ApiPropertyOptional({ example: 'AM5' })
  @IsOptional()
  value?: any;

  @ApiPropertyOptional({ example: 'MOTHERBOARD' })
  @IsOptional()
  @IsString()
  targetComponentType?: string;

  @ApiPropertyOptional({ example: 'socketType' })
  @IsOptional()
  @IsString()
  targetAttributePath?: string;
}

export class CreateRuleWarningDto {
  @ApiProperty({ example: 'BIOS update may be required for this CPU' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ example: 'Motherboards manufactured prior to batch 2024 need update' })
  @IsOptional()
  @IsString()
  details?: string;
}

export class CreateCompatibilityRuleDto {
  @ApiProperty({ example: 'AM5 Socket Compatibility' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Ensures CPU AM5 socket matches Motherboard AM5 socket' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ enum: CompatibilityRuleType, example: CompatibilityRuleType.SOCKET_MATCH })
  @IsEnum(CompatibilityRuleType)
  ruleType!: CompatibilityRuleType;

  @ApiPropertyOptional({ enum: CompatibilitySeverity, default: CompatibilitySeverity.ERROR })
  @IsOptional()
  @IsEnum(CompatibilitySeverity)
  severity?: CompatibilitySeverity = CompatibilitySeverity.ERROR;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsInt()
  priority?: number = 100;

  @ApiPropertyOptional({ example: ['cpu', 'motherboard', 'socket'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ type: [CreateRuleConditionDto] })
  @IsOptional()
  @IsArray()
  conditions?: CreateRuleConditionDto[];

  @ApiPropertyOptional({ type: [CreateRuleWarningDto] })
  @IsOptional()
  @IsArray()
  warnings?: CreateRuleWarningDto[];
}

export class UpdateCompatibilityRuleDto {
  @ApiPropertyOptional({ example: 'AM5 Socket Compatibility' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CompatibilitySeverity })
  @IsOptional()
  @IsEnum(CompatibilitySeverity)
  severity?: CompatibilitySeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CompatibilityRuleFilterDto extends AdminPaginationDto {
  @ApiPropertyOptional({ enum: CompatibilityRuleType })
  @IsOptional()
  @IsEnum(CompatibilityRuleType)
  ruleType?: CompatibilityRuleType;

  @ApiPropertyOptional({ enum: CompatibilitySeverity })
  @IsOptional()
  @IsEnum(CompatibilitySeverity)
  severity?: CompatibilitySeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

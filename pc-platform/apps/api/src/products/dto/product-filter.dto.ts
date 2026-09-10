import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

export enum ProductSortBy {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  FEATURED = 'featured',
}

export class ProductFilterDto extends PaginationDto {
  // ── Sort (override base PaginationDto to enforce enum values) ──────────────
  // `declare override` narrows the inherited `sortBy?: string` to the enum
  // without emitting a property — decorators still apply at runtime.

  @ApiPropertyOptional({
    enum: ProductSortBy,
    description: 'Sort order for results',
    example: ProductSortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(ProductSortBy)
  override sortBy: ProductSortBy | undefined = undefined;

  // ── General Filters ─────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Filter by Brand UUID' })
  @IsOptional()
  @IsString()
  brandId?: string | undefined;

  @ApiPropertyOptional({ description: 'Filter by Brand slug (e.g. amd, intel, asus)' })
  @IsOptional()
  @IsString()
  brandSlug?: string | undefined;

  @ApiPropertyOptional({ description: 'Filter by Category UUID' })
  @IsOptional()
  @IsString()
  categoryId?: string | undefined;

  @ApiPropertyOptional({ description: 'Filter by Category slug (e.g. processors, graphics-cards)' })
  @IsOptional()
  @IsString()
  categorySlug?: string | undefined;

  @ApiPropertyOptional({
    description: 'Component type enum (e.g. CPU, GPU, MOTHERBOARD, RAM, STORAGE, PSU, CASE, COOLER)',
  })
  @IsOptional()
  @IsString()
  componentType?: string | undefined;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number | undefined;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number | undefined;

  @ApiPropertyOptional({ description: 'Filter only in-stock products' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1' || value === 1)
  @IsBoolean()
  inStock?: boolean | undefined;

  @ApiPropertyOptional({ description: 'Filter featured products' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1' || value === 1)
  @IsBoolean()
  isFeatured?: boolean | undefined;

  @ApiPropertyOptional({ description: 'Filter active status (defaults to true for public catalog)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1' || value === 1)
  @IsBoolean()
  isActive?: boolean | undefined;

  // ── CPU Filters ─────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'CPU Socket (e.g. AM5, LGA1700)' })
  @IsOptional()
  @IsString()
  cpuSocket?: string | undefined;

  @ApiPropertyOptional({ description: 'Minimum CPU cores' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minCores?: number | undefined;

  @ApiPropertyOptional({ description: 'Maximum CPU cores' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxCores?: number | undefined;

  @ApiPropertyOptional({ description: 'Minimum CPU threads' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minThreads?: number | undefined;

  @ApiPropertyOptional({ description: 'Maximum CPU threads' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxThreads?: number | undefined;

  @ApiPropertyOptional({ description: 'Minimum Base Clock in MHz (e.g. 3500)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minBaseClockMhz?: number | undefined;

  @ApiPropertyOptional({ description: 'Maximum Base Clock in MHz' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxBaseClockMhz?: number | undefined;

  @ApiPropertyOptional({ description: 'Minimum Boost Clock in MHz (e.g. 5000)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minBoostClockMhz?: number | undefined;

  @ApiPropertyOptional({ description: 'Maximum Boost Clock in MHz' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxBoostClockMhz?: number | undefined;

  // ── GPU Filters ─────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'GPU Chipset or Architecture (e.g. AD102, RTX 4080)' })
  @IsOptional()
  @IsString()
  gpuChipset?: string | undefined;

  @ApiPropertyOptional({ description: 'Minimum GPU VRAM in GB' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minVramGb?: number | undefined;

  @ApiPropertyOptional({ description: 'Maximum GPU VRAM in GB' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxVramGb?: number | undefined;

  @ApiPropertyOptional({ description: 'Maximum GPU length in mm' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxGpuLengthMm?: number | undefined;

  @ApiPropertyOptional({ description: 'Maximum TDP in Watts' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxTdpW?: number | undefined;

  @ApiPropertyOptional({ description: 'GPU Manufacturer / Brand name (e.g. ASUS, MSI)' })
  @IsOptional()
  @IsString()
  gpuManufacturer?: string | undefined;

  // ── Motherboard Filters ─────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Motherboard Socket (e.g. AM5, LGA1700)' })
  @IsOptional()
  @IsString()
  mbSocket?: string | undefined;

  @ApiPropertyOptional({ description: 'Motherboard Chipset (e.g. B650, X670E, Z790)' })
  @IsOptional()
  @IsString()
  mbChipset?: string | undefined;

  @ApiPropertyOptional({ description: 'Supported RAM generation (e.g. DDR4, DDR5)' })
  @IsOptional()
  @IsString()
  mbRamType?: string | undefined;

  @ApiPropertyOptional({ description: 'Minimum RAM slots (e.g. 4)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minRamSlots?: number | undefined;

  @ApiPropertyOptional({ description: 'Motherboard form factor (e.g. ATX, mATX, Mini-ITX)' })
  @IsOptional()
  @IsString()
  mbFormFactor?: string | undefined;

  // ── RAM Filters ─────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'RAM generation (e.g. DDR4, DDR5)' })
  @IsOptional()
  @IsString()
  ramMemType?: string | undefined;

  @ApiPropertyOptional({ description: 'Total capacity in GB (e.g. 16, 32, 64)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ramCapacityGb?: number | undefined;

  @ApiPropertyOptional({ description: 'Minimum RAM speed in MHz (e.g. 3200, 6000)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minRamSpeedMhz?: number | undefined;

  @ApiPropertyOptional({ description: 'Number of modules in kit (e.g. 2)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ramStickCount?: number | undefined;

  // ── Storage Filters ─────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Storage interface (e.g. PCIe 4.0 x4, PCIe 5.0 x4, SATA III)' })
  @IsOptional()
  @IsString()
  storageInterface?: string | undefined;

  @ApiPropertyOptional({ description: 'Storage capacity in GB (e.g. 1000, 2000)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  storageCapacityGb?: number | undefined;

  @ApiPropertyOptional({ description: 'Storage form factor (e.g. M.2 2280, 2.5", 3.5")' })
  @IsOptional()
  @IsString()
  storageFormFactor?: string | undefined;

  // ── PSU Filters ─────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Minimum wattage in Watts (e.g. 750)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minWattage?: number | undefined;

  @ApiPropertyOptional({ description: 'Maximum wattage in Watts' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxWattage?: number | undefined;

  @ApiPropertyOptional({ description: 'Efficiency rating (e.g. 80+ Gold, 80+ Platinum, 80+ Titanium)' })
  @IsOptional()
  @IsString()
  psuEfficiency?: string | undefined;

  @ApiPropertyOptional({ description: 'Modularity (e.g. Full, Semi, Non-modular)' })
  @IsOptional()
  @IsString()
  psuModularity?: string | undefined;

  // ── Case Filters ────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Supported motherboard form factor (e.g. ATX, E-ATX)' })
  @IsOptional()
  @IsString()
  caseMbFormFactor?: string | undefined;

  @ApiPropertyOptional({ description: 'Filter cases that can fit a GPU of at least this length in mm' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minSupportedGpuLengthMm?: number | undefined;

  @ApiPropertyOptional({ description: 'Filter cases that can fit a CPU cooler of at least this height in mm' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minSupportedCoolerHeightMm?: number | undefined;

  @ApiPropertyOptional({ description: 'Filter cases with radiator support' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1' || value === 1)
  @IsBoolean()
  hasRadiatorSupport?: boolean | undefined;
}

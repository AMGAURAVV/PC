import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
} from 'class-validator';

// ── CPU Spec DTO ──────────────────────────────────────────────────────────────
export class UpsertCpuSpecDto {
  @ApiProperty({ example: 'AM5' })
  @IsString()
  socketType!: string;

  @ApiPropertyOptional({ example: 'Zen 4' })
  @IsOptional()
  @IsString()
  architecture?: string | undefined;

  @ApiPropertyOptional({ example: '5nm' })
  @IsOptional()
  @IsString()
  processTech?: string | undefined;

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(1)
  cores!: number;

  @ApiProperty({ example: 16 })
  @IsInt()
  @Min(1)
  threads!: number;

  @ApiProperty({ example: 4200, description: 'Base clock in MHz' })
  @IsInt()
  @Min(100)
  baseClockMhz!: number;

  @ApiPropertyOptional({ example: 5000, description: 'Boost clock in MHz' })
  @IsOptional()
  @IsInt()
  @Min(100)
  boostClockMhz?: number | undefined;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  l2CacheMb?: number | undefined;

  @ApiPropertyOptional({ example: 96 })
  @IsOptional()
  @IsNumber()
  l3CacheMb?: number | undefined;

  @ApiProperty({ example: 120, description: 'TDP in Watts' })
  @IsInt()
  @Min(1)
  tdpW!: number;

  @ApiPropertyOptional({ example: 162 })
  @IsOptional()
  @IsInt()
  maxTdpW?: number | undefined;

  @ApiProperty({ example: 'DDR5' })
  @IsString()
  memoryType!: string;

  @ApiProperty({ example: 128 })
  @IsInt()
  maxMemoryGb!: number;

  @ApiPropertyOptional({ example: 5200 })
  @IsOptional()
  @IsInt()
  maxMemorySpeedMhz?: number | undefined;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  memoryChannels?: number | undefined;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  pcieGen?: number | undefined;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  pcieLanes?: number | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasIgpu?: boolean | undefined;

  @ApiPropertyOptional({ example: 'AMD Radeon Graphics' })
  @IsOptional()
  @IsString()
  igpuModel?: string | undefined;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  coolerIncluded?: boolean | undefined;
}

// ── GPU Spec DTO ──────────────────────────────────────────────────────────────
export class UpsertGpuSpecDto {
  @ApiProperty({ example: 'RTX 4080 Super' })
  @IsString()
  chipset!: string;

  @ApiPropertyOptional({ example: 'Ada Lovelace' })
  @IsOptional()
  @IsString()
  gpuArchitecture?: string | undefined;

  @ApiPropertyOptional({ example: '4nm' })
  @IsOptional()
  @IsString()
  processTech?: string | undefined;

  @ApiProperty({ example: 16, description: 'VRAM in GB' })
  @IsInt()
  @Min(1)
  vramGb!: number;

  @ApiProperty({ example: 'GDDR6X' })
  @IsString()
  vramType!: string;

  @ApiProperty({ example: 256 })
  @IsInt()
  vramBusBit!: number;

  @ApiPropertyOptional({ example: 2295 })
  @IsOptional()
  @IsInt()
  baseClockMhz?: number | undefined;

  @ApiPropertyOptional({ example: 2550 })
  @IsOptional()
  @IsInt()
  boostClockMhz?: number | undefined;

  @ApiProperty({ example: 320, description: 'TDP in Watts' })
  @IsInt()
  tdpW!: number;

  @ApiPropertyOptional({ example: 750 })
  @IsOptional()
  @IsInt()
  recommendedPsuW?: number | undefined;

  @ApiProperty({ example: '1x 16-pin' })
  @IsString()
  powerConnectors!: string;

  @ApiPropertyOptional({ example: 'x16' })
  @IsOptional()
  @IsString()
  pcieSlot?: string | undefined;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  pcieGen?: number | undefined;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  slotWidth?: number | undefined;

  @ApiProperty({ example: 304, description: 'Length in mm' })
  @IsInt()
  lengthMm!: number;

  @ApiPropertyOptional({ example: 137 })
  @IsOptional()
  @IsInt()
  widthMm?: number | undefined;

  @ApiPropertyOptional({ example: 61 })
  @IsOptional()
  @IsInt()
  heightMm?: number | undefined;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  displayports?: number | undefined;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  hdmiPorts?: number | undefined;

  @ApiPropertyOptional({ example: '2.1a' })
  @IsOptional()
  @IsString()
  hdmiVersion?: string | undefined;

  @ApiPropertyOptional({ example: '1.4a' })
  @IsOptional()
  @IsString()
  dpVersion?: string | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasRaytracing?: boolean | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasDlss?: boolean | undefined;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasFsr?: boolean | undefined;
}

// ── Motherboard Spec DTO ──────────────────────────────────────────────────────
export class UpsertMotherboardSpecDto {
  @ApiProperty({ example: 'AM5' })
  @IsString()
  socketType!: string;

  @ApiProperty({ example: 'B650' })
  @IsString()
  chipset!: string;

  @ApiProperty({ example: 'ATX' })
  @IsString()
  formFactor!: string;

  @ApiProperty({ example: ['DDR5'] })
  @IsArray()
  @IsString({ each: true })
  supportedMemTypes!: string[];

  @ApiProperty({ example: 4 })
  @IsInt()
  ramSlots!: number;

  @ApiProperty({ example: 192 })
  @IsInt()
  maxRamGb!: number;

  @ApiPropertyOptional({ example: 6400 })
  @IsOptional()
  @IsInt()
  maxRamSpeedMhz?: number | undefined;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  pcieX16Slots?: number | undefined;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  m2Slots?: number | undefined;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  sataSlots?: number | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasWifi?: boolean | undefined;

  @ApiPropertyOptional({ example: 'Wi-Fi 6E' })
  @IsOptional()
  @IsString()
  wifiStandard?: string | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasBluetooth?: boolean | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  biosFlashback?: boolean | undefined;
}

// ── RAM Spec DTO ──────────────────────────────────────────────────────────────
export class UpsertRamSpecDto {
  @ApiProperty({ example: 'DDR5' })
  @IsString()
  memType!: string;

  @ApiProperty({ example: 32, description: 'Total capacity in GB' })
  @IsInt()
  totalCapacityGb!: number;

  @ApiProperty({ example: 2, description: 'Number of modules in kit' })
  @IsInt()
  stickCount!: number;

  @ApiProperty({ example: 16, description: 'Capacity per stick in GB' })
  @IsInt()
  capacityPerStickGb!: number;

  @ApiProperty({ example: 6000, description: 'Speed in MHz' })
  @IsInt()
  speedMhz!: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  casLatency?: number | undefined;

  @ApiPropertyOptional({ example: '30-38-38-96' })
  @IsOptional()
  @IsString()
  timing?: string | undefined;

  @ApiPropertyOptional({ example: 1.35 })
  @IsOptional()
  @IsNumber()
  voltageV?: number | undefined;

  @ApiPropertyOptional({ example: 'DIMM' })
  @IsOptional()
  @IsString()
  formFactor?: string | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasHeatspreader?: boolean | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasRgb?: boolean | undefined;
}

// ── Storage Spec DTO ──────────────────────────────────────────────────────────
export class UpsertStorageSpecDto {
  @ApiProperty({ example: 'NVMe SSD' })
  @IsString()
  storageType!: string;

  @ApiProperty({ example: 2000, description: 'Capacity in GB' })
  @IsInt()
  capacityGb!: number;

  @ApiProperty({ example: 'PCIe 4.0 x4' })
  @IsString()
  interface!: string;

  @ApiProperty({ example: 'M.2 2280' })
  @IsString()
  formFactor!: string;

  @ApiPropertyOptional({ example: 'TLC' })
  @IsOptional()
  @IsString()
  nandType?: string | undefined;

  @ApiPropertyOptional({ example: 7300 })
  @IsOptional()
  @IsInt()
  seqReadMbps?: number | undefined;

  @ApiPropertyOptional({ example: 6900 })
  @IsOptional()
  @IsInt()
  seqWriteMbps?: number | undefined;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsInt()
  tbw?: number | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  dramCache?: boolean | undefined;
}

// ── PSU Spec DTO ──────────────────────────────────────────────────────────────
export class UpsertPsuSpecDto {
  @ApiProperty({ example: 850, description: 'Wattage in Watts' })
  @IsInt()
  wattage!: number;

  @ApiProperty({ example: '80+ Gold' })
  @IsString()
  efficiencyRating!: string;

  @ApiProperty({ example: 'Full', description: 'Full, Semi, or Non-modular' })
  @IsString()
  modular!: string;

  @ApiPropertyOptional({ example: 'ATX' })
  @IsOptional()
  @IsString()
  formFactor?: string | undefined;

  @ApiPropertyOptional({ example: 'ATX 3.0' })
  @IsOptional()
  @IsString()
  atx12vVersion?: string | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasAtx3Connector?: boolean | undefined;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  warrantyYears?: number | undefined;
}

// ── Case Spec DTO ─────────────────────────────────────────────────────────────
export class UpsertCaseSpecDto {
  @ApiProperty({ example: 'Mid-Tower' })
  @IsString()
  caseType!: string;

  @ApiProperty({ example: ['ATX', 'mATX', 'Mini-ITX'] })
  @IsArray()
  @IsString({ each: true })
  supportedFormFactors!: string[];

  @ApiProperty({ example: 'ATX' })
  @IsString()
  maxMbFormFactor!: string;

  @ApiProperty({ example: 380, description: 'Max GPU length in mm' })
  @IsInt()
  maxGpuLengthMm!: number;

  @ApiProperty({ example: 170, description: 'Max CPU cooler height in mm' })
  @IsInt()
  maxCpuCoolerHeightMm!: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsInt()
  maxPsuLengthMm?: number | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasFrontUsbc?: boolean | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasGlassPanel?: boolean | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasRgb?: boolean | undefined;
}

// ── Cooler Spec DTO ───────────────────────────────────────────────────────────
export class UpsertCoolerSpecDto {
  @ApiProperty({ example: 'AIO Liquid' })
  @IsString()
  coolerType!: string;

  @ApiProperty({ example: ['AM5', 'LGA1700'] })
  @IsArray()
  @IsString({ each: true })
  supportedSockets!: string[];

  @ApiProperty({ example: 280 })
  @IsInt()
  tdpRatingW!: number;

  @ApiPropertyOptional({ example: 360 })
  @IsOptional()
  @IsInt()
  radiatorSizeMm?: number | undefined;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  fanCount?: number | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasArgb?: boolean | undefined;
}

// ── Fan Spec DTO ──────────────────────────────────────────────────────────────
export class UpsertFanSpecDto {
  @ApiProperty({ example: 120 })
  @IsInt()
  sizeMm!: number;

  @ApiProperty({ example: 2000 })
  @IsInt()
  maxRpm!: number;

  @ApiPropertyOptional({ example: 68.5 })
  @IsOptional()
  @IsNumber()
  maxAirflowCfm?: number | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPwm?: boolean | undefined;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  packCount?: number | undefined;
}

// ── Monitor Spec DTO ──────────────────────────────────────────────────────────
export class UpsertMonitorSpecDto {
  @ApiProperty({ example: 27 })
  @IsNumber()
  screenSizeInch!: number;

  @ApiProperty({ example: 2560 })
  @IsInt()
  resolutionW!: number;

  @ApiProperty({ example: 1440 })
  @IsInt()
  resolutionH!: number;

  @ApiProperty({ example: 'IPS' })
  @IsString()
  panelType!: string;

  @ApiProperty({ example: 165 })
  @IsInt()
  refreshRateHz!: number;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber()
  responseTimeMs?: number | undefined;
}

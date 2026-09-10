/**
 * Normalized Hardware Component Specifications
 *
 * Strongly-typed domain representations of hardware specs extracted
 * from raw product catalog metadata or EAV tables.
 *
 * Rules evaluate against THESE normalized specifications, ensuring
 * compatibility is never derived from marketing names.
 */

export type FormFactor = 'E-ATX' | 'ATX' | 'Micro-ATX' | 'Mini-ITX' | string;

export interface NormalizedCpu {
  readonly productId: string;
  readonly name: string;
  readonly socketType?: string | undefined; // e.g. "AM5", "LGA1700", "AM4"
  readonly architecture?: string | undefined; // e.g. "Zen 4", "Raptor Lake"
  readonly generation?: string | undefined; // e.g. "Ryzen 7000", "13th Gen", "14th Gen"
  readonly cores?: number | undefined;
  readonly threads?: number | undefined;
  readonly tdpW?: number | undefined; // Base TDP in watts
  readonly maxTdpW?: number | undefined; // Peak TDP / PPT / PL2
  readonly memoryType?: string | undefined; // e.g. "DDR5", "DDR4"
  readonly maxMemoryGb?: number | undefined; // CPU memory controller limit
  readonly maxMemorySpeedMhz?: number | undefined; // Native supported speed (e.g. 5200, 5600)
  readonly pcieGen?: number | undefined;
  readonly pcieLanes?: number | undefined;
  readonly hasIgpu?: boolean | undefined;
  readonly coolerIncluded?: boolean | undefined;
}

export interface M2SlotDetail {
  readonly slotNumber: number;
  readonly key: 'M' | 'B' | 'B+M' | string;
  readonly pcieGen?: number | undefined; // e.g. 4, 5
  readonly pcieLanes?: number | undefined; // typically 4
  readonly supportsSata: boolean;
  readonly supportsNvme: boolean;
  readonly maxFormFactor?: string | undefined; // e.g. "2280", "22110"
}

export interface NormalizedMotherboard {
  readonly productId: string;
  readonly name: string;
  readonly socketType?: string | undefined; // e.g. "AM5", "LGA1700"
  readonly chipset?: string | undefined; // e.g. "X670E", "Z790", "B650", "B760"
  readonly formFactor?: FormFactor | undefined;
  readonly supportedMemTypes: string[]; // e.g. ["DDR5"] or ["DDR4"]
  readonly ramSlots?: number | undefined; // e.g. 2, 4, 8
  readonly maxRamGb?: number | undefined; // e.g. 128, 192
  readonly maxRamSpeedMhz?: number | undefined; // Max OC / XMP speed e.g. 6400, 7200
  readonly pcieX16Slots?: number | undefined; // Physical x16 slots
  readonly pcieX4Slots?: number | undefined;
  readonly pcieX1Slots?: number | undefined;
  readonly m2Slots?: number | undefined; // Total M.2 slots
  readonly m2Details?: M2SlotDetail[] | undefined;
  readonly sataSlots?: number | undefined; // Available SATA 6Gb/s ports
  readonly biosFlashback?: boolean | undefined; // Dedicated button to flash BIOS without CPU
  readonly minBiosVersionForCpu?: Record<string, string> | undefined; // CPU series -> BIOS version
  readonly cpuPowerConnectors?: string[] | undefined; // e.g. ["8-pin", "8-pin"] or ["8-pin", "4-pin"]
  readonly fanHeaders?: number | undefined; // Total chassis/pump headers
  readonly cpuFanHeaders?: number | undefined;
  readonly chassisFanHeaders?: number | undefined;
  readonly pumpHeaders?: number | undefined;
  readonly argbHeaders?: number | undefined;
  readonly rgbHeaders?: number | undefined;
  readonly hasWifi?: boolean | undefined;
}

export interface NormalizedRam {
  readonly productId: string;
  readonly name: string;
  readonly memType?: string | undefined; // "DDR5", "DDR4", "DDR3"
  readonly totalCapacityGb: number; // e.g. 32, 64
  readonly stickCount: number; // e.g. 2 (for 2x16GB)
  readonly capacityPerStickGb: number;
  readonly speedMhz?: number | undefined; // e.g. 6000
  readonly casLatency?: number | undefined; // e.g. 30
  readonly voltageV?: number | undefined;
  readonly heightMm?: number | undefined; // For cooler clearance
  readonly isEcc?: boolean | undefined;
}

export interface NormalizedGpu {
  readonly productId: string;
  readonly name: string;
  readonly lengthMm?: number | undefined; // e.g. 336
  readonly widthMm?: number | undefined;
  readonly heightMm?: number | undefined;
  readonly slotWidth?: number | undefined; // e.g. 2, 3, 3.5 slots
  readonly tdpW?: number | undefined; // e.g. 450
  readonly recommendedPsuW?: number | undefined; // e.g. 850, 1000
  readonly pciePowerConnectors?: {
    pin16Count: number; // 12VHPWR / 12V-2x6
    pin8Count: number; // standard 8-pin / 6+2 pin PCIe
    pin6Count: number; // standard 6-pin PCIe
  } | undefined;
  readonly requiredPcieSlotWidth?: 'x16' | 'x8' | string | undefined;
  readonly pcieGen?: number | undefined;
  readonly vramGb?: number | undefined;
}

export interface NormalizedStorage {
  readonly productId: string;
  readonly name: string;
  readonly storageType?: 'NVMe SSD' | 'SATA SSD' | 'HDD' | string | undefined;
  readonly interface?: 'PCIe 5.0 x4' | 'PCIe 4.0 x4' | 'PCIe 3.0 x4' | 'SATA III' | string | undefined;
  readonly formFactor?: 'M.2 2280' | 'M.2 2230' | '2.5"' | '3.5"' | string | undefined;
  readonly isM2: boolean;
  readonly isSata: boolean;
  readonly isNvme: boolean;
  readonly m2Key?: 'M' | 'B' | 'B+M' | undefined;
  readonly capacityGb?: number | undefined;
}

export interface NormalizedPsu {
  readonly productId: string;
  readonly name: string;
  readonly wattage?: number | undefined; // e.g. 750, 850, 1000
  readonly efficiencyRating?: string | undefined; // "80+ Gold", "80+ Platinum"
  readonly formFactor?: 'ATX' | 'SFX' | 'SFX-L' | string | undefined;
  readonly lengthMm?: number | undefined;
  readonly has12vhpwr?: boolean | undefined; // ATX 3.0 / PCIe 5.0 16-pin connector
  readonly pcie8PinCount?: number | undefined; // Total 6+2 or 8-pin PCIe cables
  readonly pcie6PinCount?: number | undefined;
  readonly eps12vConnectors?: number | undefined; // CPU 8-pin (4+4) EPS connectors (usually 1 or 2)
  readonly sataPowerConnectors?: number | undefined;
}

export interface RadiatorPositionSupport {
  readonly location: 'top' | 'front' | 'side' | 'bottom' | 'rear' | string;
  readonly maxMm: number; // e.g. 360, 280, 240, 120
}

export interface NormalizedCase {
  readonly productId: string;
  readonly name: string;
  readonly caseType?: string | undefined; // "Mid-Tower", "Full-Tower", "Mini-ITX"
  readonly supportedFormFactors: FormFactor[];
  readonly maxGpuLengthMm?: number | undefined; // e.g. 446
  readonly maxGpuWidthMm?: number | undefined;
  readonly maxCpuCoolerHeightMm?: number | undefined; // e.g. 167
  readonly maxPsuLengthMm?: number | undefined;
  readonly pciSlots?: number | undefined; // e.g. 7, 8 (or 2 for ITX)
  readonly radiatorSupport: RadiatorPositionSupport[];
  readonly maxRadiatorSizeMm?: number | undefined; // Max radiator anywhere in case
  readonly includedFans?: number | undefined;
  readonly maxFans?: number | undefined;
}

export interface NormalizedCooler {
  readonly productId: string;
  readonly name: string;
  readonly coolerType: 'Air' | 'Liquid' | 'Passive';
  readonly supportedSockets: string[]; // e.g. ["AM5", "AM4", "LGA1700"]
  readonly heightMm?: number | undefined; // For air cooler height
  readonly radiatorSizeMm?: number | undefined; // e.g. 240, 280, 360, 420 for AIO
  readonly tdpRatingW?: number | undefined; // Thermal dissipation capacity
  readonly fanCount?: number | undefined;
  readonly fanHeadersNeeded?: number | undefined; // e.g. CPU_FAN + PUMP
  readonly rgbType?: 'ARGB' | 'RGB' | 'None' | undefined;
}

export interface NormalizedFan {
  readonly productId: string;
  readonly name: string;
  readonly sizeMm?: number | undefined; // 120, 140
  readonly quantity: number;
  readonly connectorType?: '4-pin PWM' | '3-pin' | 'Proprietary' | undefined;
  readonly rgbType?: 'ARGB' | 'RGB' | 'None' | undefined;
}

export interface NormalizedExpansionCard {
  readonly productId: string;
  readonly name: string;
  readonly cardType?: 'Sound Card' | 'Capture Card' | 'Network Card' | 'RAID Controller' | string | undefined;
  readonly requiredPcieSlotWidth: 'x1' | 'x4' | 'x8' | 'x16';
  readonly pcieGen?: number | undefined;
  readonly slotWidth: number; // bracket width (usually 1 slot)
  readonly powerRequiredW?: number | undefined;
}

export interface NormalizedMonitor {
  readonly productId: string;
  readonly name: string;
  readonly resolution?: string | undefined;
  readonly refreshRateHz?: number | undefined;
  readonly ports: string[];
}

export interface NormalizedOther {
  readonly productId: string;
  readonly name: string;
  readonly powerW?: number | undefined;
  readonly rawSpecs: Record<string, any>;
}

export interface NormalizedBuild {
  cpu?: NormalizedCpu | undefined;
  motherboard?: NormalizedMotherboard | undefined;
  cpuCooler?: NormalizedCooler | undefined;
  ram: NormalizedRam[];
  gpu?: NormalizedGpu | undefined;
  storage: NormalizedStorage[];
  psu?: NormalizedPsu | undefined;
  case?: NormalizedCase | undefined;
  fans: NormalizedFan[];
  expansionCards: NormalizedExpansionCard[];
  monitor?: NormalizedMonitor | undefined;
  otherComponents: NormalizedOther[];
}

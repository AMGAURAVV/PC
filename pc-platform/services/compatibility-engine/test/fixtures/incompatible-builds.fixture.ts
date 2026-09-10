import { ComponentCategory, type BuildComponents } from '@pc-platform/types';

/**
 * Fixture: CPU Socket Mismatch (AM5 CPU on LGA1700 Motherboard)
 */
export const socketMismatchBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-7950x',
    name: 'AMD Ryzen 9 7950X',
    category: ComponentCategory.CPU,
    specs: { socketType: 'AM5', tdpW: 170 },
  },
  motherboard: {
    productId: 'mb-z790',
    name: 'MSI MAG Z790 Tomahawk WiFi',
    category: ComponentCategory.MOTHERBOARD,
    specs: { socketType: 'LGA1700', chipset: 'Z790', supportedMemTypes: ['DDR5'] },
  },
};

/**
 * Fixture: Chipset Platform Mismatch (Intel LGA1700 CPU on AMD AM5 Motherboard)
 */
export const chipsetMismatchBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-13900k',
    name: 'Intel Core i9-13900K',
    category: ComponentCategory.CPU,
    specs: { socketType: 'LGA1700', tdpW: 125 },
  },
  motherboard: {
    productId: 'mb-b650',
    name: 'ASUS TUF Gaming B650-Plus',
    category: ComponentCategory.MOTHERBOARD,
    specs: { socketType: 'AM5', chipset: 'B650', supportedMemTypes: ['DDR5'] },
  },
};

/**
 * Fixture: RAM Generation Mismatch (DDR4 RAM on DDR5-only Motherboard)
 */
export const ramGenerationMismatchBuild: BuildComponents = {
  motherboard: {
    productId: 'mb-b650',
    name: 'Gigabyte B650 AORUS Elite',
    category: ComponentCategory.MOTHERBOARD,
    specs: { socketType: 'AM5', supportedMemTypes: ['DDR5'], ramSlots: 4 },
  },
  ram: [
    {
      productId: 'ram-ddr4-32gb',
      name: 'Corsair Vengeance LPX 32GB (2x16GB) DDR4-3200',
      category: ComponentCategory.RAM,
      specs: { memType: 'DDR4', totalCapacityGb: 32, stickCount: 2 },
    },
  ],
};

/**
 * Fixture: RAM Capacity Exceeded (256GB on 128GB max motherboard)
 */
export const ramCapacityExceededBuild: BuildComponents = {
  motherboard: {
    productId: 'mb-z690',
    name: 'ASUS Prime Z690-P',
    category: ComponentCategory.MOTHERBOARD,
    specs: { socketType: 'LGA1700', maxRamGb: 128, ramSlots: 4, supportedMemTypes: ['DDR5'] },
  },
  ram: [
    {
      productId: 'ram-128gb-1',
      name: 'Crucial 128GB (2x64GB) DDR5',
      category: ComponentCategory.RAM,
      specs: { memType: 'DDR5', totalCapacityGb: 128, stickCount: 2 },
    },
    {
      productId: 'ram-128gb-2',
      name: 'Crucial 128GB (2x64GB) DDR5',
      category: ComponentCategory.RAM,
      specs: { memType: 'DDR5', totalCapacityGb: 128, stickCount: 2 },
    },
  ],
};

/**
 * Fixture: RAM Slot Limit Exceeded (6 sticks on 4-slot motherboard)
 */
export const ramSlotLimitExceededBuild: BuildComponents = {
  motherboard: {
    productId: 'mb-b650',
    name: 'MSI B650 Gaming Plus',
    category: ComponentCategory.MOTHERBOARD,
    specs: { ramSlots: 4, supportedMemTypes: ['DDR5'] },
  },
  ram: [
    {
      productId: 'ram-kit-4x',
      name: 'G.Skill 64GB (4x16GB) DDR5',
      category: ComponentCategory.RAM,
      specs: { memType: 'DDR5', totalCapacityGb: 64, stickCount: 4 },
    },
    {
      productId: 'ram-kit-2x',
      name: 'G.Skill 32GB (2x16GB) DDR5',
      category: ComponentCategory.RAM,
      specs: { memType: 'DDR5', totalCapacityGb: 32, stickCount: 2 },
    },
  ],
};

/**
 * Fixture: GPU Length Exceeds Case Clearance
 */
export const gpuLengthExceededBuild: BuildComponents = {
  gpu: {
    productId: 'gpu-4090-strix',
    name: 'ASUS ROG Strix GeForce RTX 4090',
    category: ComponentCategory.GPU,
    specs: { lengthMm: 357.6, tdpW: 450 },
  },
  case: {
    productId: 'case-compact',
    name: 'Compact Mini Case',
    category: ComponentCategory.CASE,
    specs: { maxGpuLengthMm: 300, supportedFormFactors: ['ATX'] },
  },
};

/**
 * Fixture: CPU Air Cooler Exceeds Case Side Panel Clearance
 */
export const coolerHeightExceededBuild: BuildComponents = {
  cpuCooler: {
    productId: 'cooler-nh-d15',
    name: 'Noctua NH-D15',
    category: ComponentCategory.COOLING,
    specs: { coolerType: 'Air', heightMm: 165 },
  },
  case: {
    productId: 'case-slim',
    name: 'Slim Micro-ATX Case',
    category: ComponentCategory.CASE,
    specs: { maxCpuCoolerHeightMm: 145, supportedFormFactors: ['Micro-ATX'] },
  },
};

/**
 * Fixture: Liquid Cooler Radiator Exceeds Case Radiator Mounts
 */
export const radiatorSizeExceededBuild: BuildComponents = {
  cpuCooler: {
    productId: 'cooler-420-aio',
    name: 'Arctic Liquid Freezer II 420mm AIO',
    category: ComponentCategory.COOLING,
    specs: { coolerType: 'Liquid', radiatorSizeMm: 420 },
  },
  case: {
    productId: 'case-mid-tower',
    name: 'Corsair 4000D Airflow',
    category: ComponentCategory.CASE,
    specs: {
      supportedFormFactors: ['ATX'],
      radiatorSupport: [
        { location: 'front', maxMm: 360 },
        { location: 'top', maxMm: 280 },
      ],
    },
  },
};

/**
 * Fixture: Motherboard Form Factor Incompatible with Case (ATX board in Mini-ITX case)
 */
export const formFactorMismatchBuild: BuildComponents = {
  motherboard: {
    productId: 'mb-atx',
    name: 'ASUS ROG Strix Z790-E ATX Motherboard',
    category: ComponentCategory.MOTHERBOARD,
    specs: { formFactor: 'ATX', socketType: 'LGA1700' },
  },
  case: {
    productId: 'case-itx',
    name: 'Cooler Master NR200P Mini-ITX Case',
    category: ComponentCategory.CASE,
    specs: { supportedFormFactors: ['Mini-ITX'] },
  },
};

/**
 * Fixture: PSU Continuous Wattage Deficit (450W PSU on ~750W system)
 */
export const psuWattageDeficitBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-13900k',
    name: 'Intel Core i9-13900K',
    category: ComponentCategory.CPU,
    specs: { tdpW: 125, maxTdpW: 253 },
  },
  gpu: {
    productId: 'gpu-4090',
    name: 'NVIDIA RTX 4090',
    category: ComponentCategory.GPU,
    specs: { tdpW: 450 },
  },
  psu: {
    productId: 'psu-450w',
    name: 'Generic 450W PSU',
    category: ComponentCategory.PSU,
    specs: { wattage: 450 },
  },
};

/**
 * Fixture: PSU Missing GPU Auxiliary Power Connectors
 */
export const psuMissingGpuConnectorsBuild: BuildComponents = {
  gpu: {
    productId: 'gpu-7900xtx',
    name: 'Sapphire Nitro+ Radeon RX 7900 XTX (Requires 3x 8-pin)',
    category: ComponentCategory.GPU,
    specs: { powerConnectors: '3x 8-pin', tdpW: 355 },
  },
  psu: {
    productId: 'psu-basic-600w',
    name: 'Basic 600W PSU (Only 1x 8-pin)',
    category: ComponentCategory.PSU,
    specs: { wattage: 650, pcieConnectors: [{ type: '8-pin', count: 1 }] },
  },
};

/**
 * Fixture: SATA Storage Ports Exceeded (6 SATA drives on 4-port board)
 */
export const sataPortsExceededBuild: BuildComponents = {
  motherboard: {
    productId: 'mb-entry',
    name: 'Entry H610 Motherboard',
    category: ComponentCategory.MOTHERBOARD,
    specs: { sataSlots: 4 },
  },
  storage: Array.from({ length: 6 }, (_, i) => ({
    productId: `sata-drive-${i}`,
    name: `Seagate Barracuda 2TB HDD #${i + 1}`,
    category: ComponentCategory.STORAGE,
    specs: { storageType: 'HDD', interface: 'SATA III', formFactor: '3.5"' },
  })),
};

/**
 * Fixture: M.2 Sockets Exceeded (4 M.2 NVMe drives on 2-slot board)
 */
export const m2SlotsExceededBuild: BuildComponents = {
  motherboard: {
    productId: 'mb-matx-2slots',
    name: 'ASRock B650M-HDV/M.2 (2x M.2 slots)',
    category: ComponentCategory.MOTHERBOARD,
    specs: { m2Slots: 2 },
  },
  storage: Array.from({ length: 4 }, (_, i) => ({
    productId: `nvme-drive-${i}`,
    name: `Crucial P3 1TB NVMe SSD #${i + 1}`,
    category: ComponentCategory.STORAGE,
    specs: { storageType: 'NVMe SSD', interface: 'PCIe 4.0 x4', formFactor: 'M.2 2280' },
  })),
};

/**
 * Fixture: SATA M.2 in PCIe-only M.2 Sockets
 */
export const sataM2InPcieOnlySlotBuild: BuildComponents = {
  motherboard: {
    productId: 'mb-pcie-only-m2',
    name: 'High-End Z790 Motherboard (PCIe-only M.2)',
    category: ComponentCategory.MOTHERBOARD,
    specs: {
      m2Slots: 3,
      m2Details: [
        { slot: 1, key: 'M', pcie: 5, sata: false },
        { slot: 2, key: 'M', pcie: 4, sata: false },
        { slot: 3, key: 'M', pcie: 4, sata: false },
      ],
    },
  },
  storage: [
    {
      productId: 'ssd-sata-m2',
      name: 'Western Digital Blue SA510 SATA M.2 2280',
      category: ComponentCategory.STORAGE,
      specs: { storageType: 'SATA SSD', interface: 'SATA III', formFactor: 'M.2 2280' },
    },
  ],
};

/**
 * Fixture: PCIe Expansion Slots Exceeded (Two x16 cards on 1-slot board)
 */
export const pcieSlotsExceededBuild: BuildComponents = {
  motherboard: {
    productId: 'mb-single-x16',
    name: 'Micro-ATX Motherboard (1x PCIe x16 slot)',
    category: ComponentCategory.MOTHERBOARD,
    specs: { pcieX16Slots: 1, pcieX1Slots: 1 },
  },
  gpu: {
    productId: 'gpu-card',
    name: 'GeForce RTX 4070',
    category: ComponentCategory.GPU,
    specs: { pcieSlot: 'x16', slotWidth: 2 },
  },
  expansionCards: [
    {
      productId: 'card-10gbe-nic',
      name: 'Intel X540-T2 10GbE Network Adapter',
      category: ComponentCategory.EXPANSION_CARD,
      specs: { requiredPcieSlotWidth: 'x16', slotWidth: 1 },
    },
  ],
};

/**
 * Fixture: Rear Expansion Slots Exceeded in Case
 */
export const expansionSlotsExceededBuild: BuildComponents = {
  case: {
    productId: 'case-itx-2slot',
    name: 'Mini-ITX Case (2 Rear PCI Slots)',
    category: ComponentCategory.CASE,
    specs: { pciSlots: 2, supportedFormFactors: ['Mini-ITX'] },
  },
  gpu: {
    productId: 'gpu-thick-3slot',
    name: 'Triple-Slot RTX 4080 (3.5 Slots)',
    category: ComponentCategory.GPU,
    specs: { slotWidth: 3.5 },
  },
};

/**
 * Fixture: CPU Cooler Lacks Mounting Bracket for Socket
 */
export const coolerSocketUnsupportedBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-am5',
    name: 'AMD Ryzen 7 7700X (AM5)',
    category: ComponentCategory.CPU,
    specs: { socketType: 'AM5', tdpW: 105 },
  },
  cpuCooler: {
    productId: 'cooler-lga1200-only',
    name: 'Legacy Cooler (LGA1200 / LGA115x only)',
    category: ComponentCategory.COOLING,
    specs: { coolerType: 'Air', supportedSockets: ['LGA1200', 'LGA115X'], heightMm: 155 },
  },
};

/**
 * Fixture: CPU Cooler TDP Severely Insufficient
 */
export const coolerTdpInsufficientBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-7950x',
    name: 'AMD Ryzen 9 7950X (170W Base TDP)',
    category: ComponentCategory.CPU,
    specs: { socketType: 'AM5', tdpW: 170, maxTdpW: 230 },
  },
  cpuCooler: {
    productId: 'cooler-65w-lowprofile',
    name: 'Noctua NH-L9a 65W Low Profile Cooler',
    category: ComponentCategory.COOLING,
    specs: { coolerType: 'Air', supportedSockets: ['AM5'], tdpRatingW: 65, heightMm: 37 },
  },
};

/**
 * Fixture: Motherboard EPS CPU Power Connector Missing from PSU
 */
export const motherboardEpsMissingBuild: BuildComponents = {
  motherboard: {
    productId: 'mb-atx',
    name: 'ATX Motherboard (Requires 8-pin EPS)',
    category: ComponentCategory.MOTHERBOARD,
    specs: { cpuPowerConnectors: ['8-pin'] },
  },
  psu: {
    productId: 'psu-no-eps',
    name: 'Proprietary PSU (0 EPS Connectors)',
    category: ComponentCategory.PSU,
    specs: { wattage: 500, eps12vConnectors: 0 },
  },
};

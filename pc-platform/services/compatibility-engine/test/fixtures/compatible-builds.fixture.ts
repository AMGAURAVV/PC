import { ComponentCategory, type BuildComponents } from '@pc-platform/types';

/**
 * Fixture: High-end Enthusiast AMD AM5 System
 * Fully compatible flagship PC build.
 */
export const highEndAmdCompatibleBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-7950x',
    name: 'AMD Ryzen 9 7950X',
    category: ComponentCategory.CPU,
    specs: {
      socketType: 'AM5',
      architecture: 'Zen 4',
      tdpW: 170,
      maxTdpW: 230,
      memoryType: 'DDR5',
      maxMemoryGb: 192,
      maxMemorySpeedMhz: 5200,
      coolerIncluded: false,
    },
  },
  motherboard: {
    productId: 'mb-x670e-hero',
    name: 'ASUS ROG Crosshair X670E Hero',
    category: ComponentCategory.MOTHERBOARD,
    specs: {
      socketType: 'AM5',
      chipset: 'X670E',
      formFactor: 'ATX',
      supportedMemTypes: ['DDR5'],
      ramSlots: 4,
      maxRamGb: 192,
      maxRamSpeedMhz: 6400,
      pcieX16Slots: 2,
      pcieX1Slots: 1,
      m2Slots: 4,
      m2Details: [
        { slot: 1, key: 'M', pcie: 5, sata: false },
        { slot: 2, key: 'M', pcie: 4, sata: false },
        { slot: 3, key: 'M', pcie: 4, sata: true },
        { slot: 4, key: 'M', pcie: 4, sata: true },
      ],
      sataSlots: 6,
      cpuPowerConnectors: ['8-pin', '8-pin'],
      fanHeaders: 8,
      biosFlashback: true,
    },
  },
  cpuCooler: {
    productId: 'cooler-nh-d15',
    name: 'Noctua NH-D15 Chromax.Black',
    category: ComponentCategory.COOLING,
    specs: {
      coolerType: 'Air',
      supportedSockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200'],
      heightMm: 165,
      tdpRatingW: 250,
      fanCount: 2,
      fanHeadersNeeded: 2,
    },
  },
  ram: [
    {
      productId: 'ram-gskill-64gb',
      name: 'G.Skill Trident Z5 RGB 64GB (2x32GB) DDR5-6000',
      category: ComponentCategory.RAM,
      specs: {
        memType: 'DDR5',
        totalCapacityGb: 64,
        stickCount: 2,
        capacityPerStickGb: 32,
        speedMhz: 6000,
      },
    },
  ],
  gpu: {
    productId: 'gpu-rtx-4090',
    name: 'NVIDIA GeForce RTX 4090 Founders Edition',
    category: ComponentCategory.GPU,
    specs: {
      lengthMm: 336,
      widthMm: 140,
      heightMm: 61,
      slotWidth: 3,
      tdpW: 450,
      recommendedPsuW: 850,
      powerConnectors: '1x 16-pin',
    },
  },
  storage: [
    {
      productId: 'ssd-990pro-2tb',
      name: 'Samsung 990 Pro 2TB NVMe M.2 SSD',
      category: ComponentCategory.STORAGE,
      specs: {
        storageType: 'NVMe SSD',
        interface: 'PCIe 4.0 x4',
        formFactor: 'M.2 2280',
        capacityGb: 2000,
        m2Key: 'M',
      },
    },
    {
      productId: 'ssd-990pro-4tb',
      name: 'Samsung 990 Pro 4TB NVMe M.2 SSD',
      category: ComponentCategory.STORAGE,
      specs: {
        storageType: 'NVMe SSD',
        interface: 'PCIe 4.0 x4',
        formFactor: 'M.2 2280',
        capacityGb: 4000,
        m2Key: 'M',
      },
    },
  ],
  psu: {
    productId: 'psu-seasonic-1000w',
    name: 'Seasonic PRIME TX-1000 ATX 3.0',
    category: ComponentCategory.PSU,
    specs: {
      wattage: 1000,
      efficiencyRating: '80+ Titanium',
      formFactor: 'ATX',
      hasAtx3Connector: true,
      eps12vConnectors: 2,
      pcieConnectors: [
        { type: '16-pin', count: 1 },
        { type: '8-pin', count: 4 },
      ],
      sataConnectors: 12,
    },
  },
  case: {
    productId: 'case-o11d-evo',
    name: 'Lian Li O11 Dynamic Evo',
    category: ComponentCategory.CASE,
    specs: {
      supportedFormFactors: ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX'],
      maxGpuLengthMm: 446,
      maxCpuCoolerHeightMm: 167,
      pciSlots: 8,
      radiatorSupport: [
        { location: 'top', maxMm: 360 },
        { location: 'side', maxMm: 360 },
        { location: 'bottom', maxMm: 360 },
      ],
    },
  },
  fans: [
    {
      productId: 'fan-uni-3pack',
      name: 'Lian Li UNI Fan SL120 (3-Pack)',
      category: ComponentCategory.FAN,
      specs: {
        sizeMm: 120,
        quantity: 3,
        connectorType: '4-pin PWM',
      },
    },
  ],
  monitor: {
    productId: 'mon-lg-27gp850',
    name: 'LG 27GP850-B 27" QHD 165Hz',
    category: ComponentCategory.MONITOR,
    specs: {
      resolution: '2560x1440',
      refreshRateHz: 165,
      ports: ['DisplayPort 1.4', 'HDMI 2.0'],
    },
  },
};

/**
 * Fixture: Intel 13th Gen Liquid Cooled Gaming Build
 */
export const intelLiquidCooledBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-13900k',
    name: 'Intel Core i9-13900K',
    category: ComponentCategory.CPU,
    specs: {
      socketType: 'LGA1700',
      architecture: 'Raptor Lake',
      tdpW: 125,
      maxTdpW: 253,
      memoryType: 'DDR5',
      maxMemoryGb: 192,
      maxMemorySpeedMhz: 5600,
      coolerIncluded: false,
    },
  },
  motherboard: {
    productId: 'mb-msi-z790',
    name: 'MSI MAG Z790 Tomahawk WiFi',
    category: ComponentCategory.MOTHERBOARD,
    specs: {
      socketType: 'LGA1700',
      chipset: 'Z790',
      formFactor: 'ATX',
      supportedMemTypes: ['DDR5'],
      ramSlots: 4,
      maxRamGb: 192,
      maxRamSpeedMhz: 7200,
      pcieX16Slots: 2,
      m2Slots: 4,
      sataSlots: 6,
      cpuPowerConnectors: ['8-pin', '8-pin'],
      fanHeaders: 6,
      biosFlashback: true,
    },
  },
  cpuCooler: {
    productId: 'cooler-aio-360',
    name: 'Corsair iCUE H150i Elite 360mm Liquid Cooler',
    category: ComponentCategory.COOLING,
    specs: {
      coolerType: 'Liquid',
      supportedSockets: ['LGA1700', 'AM5', 'AM4'],
      radiatorSizeMm: 360,
      tdpRatingW: 300,
      fanCount: 3,
      fanHeadersNeeded: 2,
    },
  },
  ram: [
    {
      productId: 'ram-corsair-32gb',
      name: 'Corsair Vengeance 32GB (2x16GB) DDR5-5600',
      category: ComponentCategory.RAM,
      specs: {
        memType: 'DDR5',
        totalCapacityGb: 32,
        stickCount: 2,
        speedMhz: 5600,
      },
    },
  ],
  gpu: {
    productId: 'gpu-rtx-4080',
    name: 'MSI Gaming X Trio RTX 4080',
    category: ComponentCategory.GPU,
    specs: {
      lengthMm: 337,
      slotWidth: 3,
      tdpW: 320,
      recommendedPsuW: 750,
      powerConnectors: '1x 16-pin',
    },
  },
  psu: {
    productId: 'psu-850w-atx3',
    name: 'Corsair RM850x Shift ATX 3.0',
    category: ComponentCategory.PSU,
    specs: {
      wattage: 850,
      formFactor: 'ATX',
      hasAtx3Connector: true,
      eps12vConnectors: 2,
      pcie8PinConnectors: 4,
    },
  },
  case: {
    productId: 'case-nzxt-h7',
    name: 'NZXT H7 Flow Mid-Tower',
    category: ComponentCategory.CASE,
    specs: {
      supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'],
      maxGpuLengthMm: 400,
      maxCpuCoolerHeightMm: 185,
      pciSlots: 7,
      radiatorSupport: [
        { location: 'top', maxMm: 360 },
        { location: 'front', maxMm: 360 },
      ],
    },
  },
};

/**
 * Fixture: Budget Micro-ATX Build
 */
export const budgetMicroAtxBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-7600',
    name: 'AMD Ryzen 5 7600',
    category: ComponentCategory.CPU,
    specs: {
      socketType: 'AM5',
      tdpW: 65,
      maxTdpW: 88,
      coolerIncluded: true,
    },
  },
  motherboard: {
    productId: 'mb-b650m',
    name: 'ASRock B650M Pro RS WiFi',
    category: ComponentCategory.MOTHERBOARD,
    specs: {
      socketType: 'AM5',
      chipset: 'B650',
      formFactor: 'Micro-ATX',
      supportedMemTypes: ['DDR5'],
      ramSlots: 4,
      maxRamGb: 192,
      pcieX16Slots: 1,
      m2Slots: 3,
      sataSlots: 4,
      cpuPowerConnectors: ['8-pin'],
      fanHeaders: 4,
    },
  },
  ram: [
    {
      productId: 'ram-32gb',
      name: 'TeamGroup T-Create 32GB (2x16GB) DDR5-5600',
      category: ComponentCategory.RAM,
      specs: {
        memType: 'DDR5',
        totalCapacityGb: 32,
        stickCount: 2,
        speedMhz: 5600,
      },
    },
  ],
  gpu: {
    productId: 'gpu-rx-7800xt',
    name: 'Sapphire PULSE Radeon RX 7800 XT',
    category: ComponentCategory.GPU,
    specs: {
      lengthMm: 280,
      slotWidth: 2.5,
      tdpW: 263,
      recommendedPsuW: 700,
      powerConnectors: '2x 8-pin',
    },
  },
  storage: [
    {
      productId: 'ssd-1tb',
      name: 'Crucial P3 Plus 1TB M.2 NVMe',
      category: ComponentCategory.STORAGE,
      specs: {
        storageType: 'NVMe SSD',
        formFactor: 'M.2 2280',
        capacityGb: 1000,
      },
    },
  ],
  psu: {
    productId: 'psu-750w',
    name: 'MSI MAG A750GL 750W',
    category: ComponentCategory.PSU,
    specs: {
      wattage: 750,
      formFactor: 'ATX',
      eps12vConnectors: 2,
      pcie8PinConnectors: 4,
    },
  },
  case: {
    productId: 'case-matx',
    name: 'Fractal Design Pop Mini Air',
    category: ComponentCategory.CASE,
    specs: {
      supportedFormFactors: ['Micro-ATX', 'Mini-ITX'],
      maxGpuLengthMm: 365,
      maxCpuCoolerHeightMm: 170,
      pciSlots: 4,
    },
  },
};

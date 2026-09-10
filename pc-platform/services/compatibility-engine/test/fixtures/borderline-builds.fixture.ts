import { ComponentCategory, type BuildComponents } from '@pc-platform/types';

/**
 * Fixture: Tight PSU Headroom (Draw exceeds 80% of PSU capacity)
 */
export const tightPsuHeadroomBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-13700k',
    name: 'Intel Core i7-13700K',
    category: ComponentCategory.CPU,
    specs: { socketType: 'LGA1700', tdpW: 125, maxTdpW: 253 },
  },
  gpu: {
    productId: 'gpu-4070ti',
    name: 'GeForce RTX 4070 Ti',
    category: ComponentCategory.GPU,
    specs: { tdpW: 285, recommendedPsuW: 750 },
  },
  psu: {
    productId: 'psu-650w',
    name: '650W Bronze PSU',
    category: ComponentCategory.PSU,
    specs: { wattage: 650, eps12vConnectors: 2, pcieConnectors: [{ type: '8-pin', count: 3 }] },
  },
};

/**
 * Fixture: RAM Speed Exceeds Motherboard Maximum Rating (Automatic Downclocking)
 */
export const ramSpeedDownclockBuild: BuildComponents = {
  motherboard: {
    productId: 'mb-b650-entry',
    name: 'Entry B650 Motherboard (Max 6000MHz)',
    category: ComponentCategory.MOTHERBOARD,
    specs: {
      socketType: 'AM5',
      supportedMemTypes: ['DDR5'],
      maxRamSpeedMhz: 6000,
    },
  },
  ram: [
    {
      productId: 'ram-7200mhz',
      name: 'TeamGroup T-Force 32GB DDR5-7200',
      category: ComponentCategory.RAM,
      specs: { memType: 'DDR5', totalCapacityGb: 32, stickCount: 2, speedMhz: 7200 },
    },
  ],
};

/**
 * Fixture: Fan Count Exceeds Motherboard Fan Headers (Splitter/Hub Needed)
 */
export const fanHeadersExceededBuild: BuildComponents = {
  motherboard: {
    productId: 'mb-basic',
    name: 'Motherboard with 3 Fan Headers',
    category: ComponentCategory.MOTHERBOARD,
    specs: { fanHeaders: 3 },
  },
  fans: [
    {
      productId: 'fans-pack-6',
      name: 'Case Fans (Pack of 6)',
      category: ComponentCategory.FAN,
      specs: { quantity: 6 },
    },
  ],
};

/**
 * Fixture: BIOS Update Required on Z690 for 14th Gen CPU (With USB Flashback)
 */
export const biosUpdateWithFlashbackBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-14700k',
    name: 'Intel Core i7-14700K',
    category: ComponentCategory.CPU,
    specs: { socketType: 'LGA1700', tdpW: 125, maxTdpW: 253, coolerIncluded: true },
  },
  motherboard: {
    productId: 'mb-z690-flashback',
    name: 'ASUS ROG Strix Z690-F Gaming WiFi',
    category: ComponentCategory.MOTHERBOARD,
    specs: {
      socketType: 'LGA1700',
      chipset: 'Z690',
      biosFlashback: true,
      supportedMemTypes: ['DDR5'],
    },
  },
};

/**
 * Fixture: BIOS Update Required on Z690 for 14th Gen CPU (Without USB Flashback)
 */
export const biosUpdateWithoutFlashbackBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-14700k',
    name: 'Intel Core i7-14700K',
    category: ComponentCategory.CPU,
    specs: { socketType: 'LGA1700', tdpW: 125, maxTdpW: 253, coolerIncluded: true },
  },
  motherboard: {
    productId: 'mb-z690-no-flashback',
    name: 'Budget Z690 Board (No USB Flashback)',
    category: ComponentCategory.MOTHERBOARD,
    specs: {
      socketType: 'LGA1700',
      chipset: 'Z690',
      biosFlashback: false,
      supportedMemTypes: ['DDR5'],
    },
  },
};

/**
 * Fixture: Dual 8-Pin EPS Recommended for High-TDP CPU
 */
export const dualEpsRecommendedBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-13900k',
    name: 'Intel Core i9-13900K (253W Peak)',
    category: ComponentCategory.CPU,
    specs: { socketType: 'LGA1700', tdpW: 125, maxTdpW: 253, coolerIncluded: true },
  },
  motherboard: {
    productId: 'mb-z790-dual-eps',
    name: 'Z790 Motherboard with Dual 8-Pin EPS',
    category: ComponentCategory.MOTHERBOARD,
    specs: { socketType: 'LGA1700', chipset: 'Z790', cpuPowerConnectors: ['8-pin', '8-pin'], supportedMemTypes: ['DDR5'] },
  },
  psu: {
    productId: 'psu-single-eps',
    name: '750W PSU with Single EPS 8-pin Cable',
    category: ComponentCategory.PSU,
    specs: { wattage: 750, eps12vConnectors: 1 },
  },
};

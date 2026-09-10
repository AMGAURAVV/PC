import { ComponentCategory, type BuildComponents } from '@pc-platform/types';

/**
 * Fixture: CPU with Missing Socket Specification
 */
export const missingCpuSocketBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-unknown-socket',
    name: 'Unspecified Prototype CPU',
    category: ComponentCategory.CPU,
    specs: { tdpW: 65 }, // socketType is intentionally missing
  },
  motherboard: {
    productId: 'mb-b650',
    name: 'B650 AM5 Motherboard',
    category: ComponentCategory.MOTHERBOARD,
    specs: { socketType: 'AM5', supportedMemTypes: ['DDR5'] },
  },
};

/**
 * Fixture: GPU with Missing Length Specification
 */
export const missingGpuDimensionsBuild: BuildComponents = {
  gpu: {
    productId: 'gpu-unknown-length',
    name: 'OEM Custom GPU',
    category: ComponentCategory.GPU,
    specs: { tdpW: 200 }, // lengthMm is intentionally missing
  },
  case: {
    productId: 'case-mid',
    name: 'Mid-Tower Case',
    category: ComponentCategory.CASE,
    specs: { maxGpuLengthMm: 320, supportedFormFactors: ['ATX'] },
  },
};

/**
 * Fixture: Air Cooler with Missing Height Specification
 */
export const missingCoolerHeightBuild: BuildComponents = {
  cpuCooler: {
    productId: 'cooler-unknown-height',
    name: 'OEM Air Cooler',
    category: ComponentCategory.COOLING,
    specs: { coolerType: 'Air', supportedSockets: ['AM5'] }, // heightMm is missing
  },
  case: {
    productId: 'case-atx',
    name: 'Standard ATX Case',
    category: ComponentCategory.CASE,
    specs: { maxCpuCoolerHeightMm: 160, supportedFormFactors: ['ATX'] },
  },
};

/**
 * Fixture: PSU with Missing Wattage Specification
 */
export const missingPsuWattageBuild: BuildComponents = {
  cpu: {
    productId: 'cpu-7600',
    name: 'Ryzen 5 7600',
    category: ComponentCategory.CPU,
    specs: { socketType: 'AM5', tdpW: 65 },
  },
  psu: {
    productId: 'psu-unknown-watts',
    name: 'Unlabeled PSU',
    category: ComponentCategory.PSU,
    specs: { efficiencyRating: '80+ Gold' }, // wattage is missing
  },
};

/**
 * Fixture: Liquid Cooler with Missing Radiator Size
 */
export const missingRadiatorSizeBuild: BuildComponents = {
  cpuCooler: {
    productId: 'cooler-unknown-rad',
    name: 'Custom Liquid Loop Kit',
    category: ComponentCategory.COOLING,
    specs: { coolerType: 'Liquid', supportedSockets: ['AM5'] }, // radiatorSizeMm missing
  },
  case: {
    productId: 'case-o11d',
    name: 'Lian Li O11 Dynamic',
    category: ComponentCategory.CASE,
    specs: { maxRadiatorSizeMm: 360, supportedFormFactors: ['ATX'] },
  },
};

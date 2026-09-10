import { ComponentCategory, Product } from '@pc-platform/types';

export type BuilderSlotId =
  | 'cpu'
  | 'motherboard'
  | 'cooler'
  | 'ram'
  | 'gpu'
  | 'storage'
  | 'psu'
  | 'case'
  | 'fans'
  | 'monitor'
  | 'keyboard'
  | 'mouse'
  | 'os'
  | 'accessories';

export interface BuilderCategoryConfig {
  id: BuilderSlotId;
  name: string;
  category: ComponentCategory;
  required: boolean;
  helpText: string;
  keyword?: string;
}

export const BUILDER_CATEGORIES: BuilderCategoryConfig[] = [
  {
    id: 'cpu',
    name: 'Processor (CPU)',
    category: ComponentCategory.CPU,
    required: true,
    helpText: 'The brain of your PC. Determines gaming FPS and multitasking performance.',
  },
  {
    id: 'motherboard',
    name: 'Motherboard',
    category: ComponentCategory.MOTHERBOARD,
    required: true,
    helpText: 'Connects all components. Must match CPU socket and case form factor.',
  },
  {
    id: 'cooler',
    name: 'CPU Cooler',
    category: ComponentCategory.COOLING,
    required: true,
    helpText: 'Liquid AIO or air tower cooling to keep CPU thermals under control.',
  },
  {
    id: 'ram',
    name: 'Memory (RAM)',
    category: ComponentCategory.RAM,
    required: true,
    helpText: 'High-speed system memory for responsive multitasking and gaming.',
  },
  {
    id: 'gpu',
    name: 'Graphics Card (GPU)',
    category: ComponentCategory.GPU,
    required: true,
    helpText: 'Powers graphics rendering, ray tracing, and high-refresh gameplay.',
  },
  {
    id: 'storage',
    name: 'Storage (SSD / HDD)',
    category: ComponentCategory.STORAGE,
    required: true,
    helpText: 'Ultra-fast NVMe PCIe 4.0/5.0 SSDs for lightning-fast OS and game boot times.',
  },
  {
    id: 'psu',
    name: 'Power Supply (PSU)',
    category: ComponentCategory.PSU,
    required: true,
    helpText: 'Clean, reliable power delivery with 80+ Gold or Platinum efficiency.',
  },
  {
    id: 'case',
    name: 'PC Chassis / Case',
    category: ComponentCategory.CASE,
    required: true,
    helpText: 'Houses all components with optimal airflow dynamics and tempered glass.',
  },
  {
    id: 'fans',
    name: 'Case Fans',
    category: ComponentCategory.FAN,
    required: false,
    helpText: 'ARGB high-static pressure PWM fans to maximize chassis ventilation.',
  },
  {
    id: 'monitor',
    name: 'Gaming Monitor',
    category: ComponentCategory.MONITOR,
    required: false,
    helpText: 'High refresh rate IPS/OLED display with G-Sync/FreeSync support.',
  },
  {
    id: 'keyboard',
    name: 'Mechanical Keyboard',
    category: ComponentCategory.PERIPHERALS,
    required: false,
    helpText: 'Tactile mechanical switches and RGB backlighting for esports accuracy.',
    keyword: 'keyboard',
  },
  {
    id: 'mouse',
    name: 'Gaming Mouse',
    category: ComponentCategory.PERIPHERALS,
    required: false,
    helpText: 'Ultra-lightweight optical sensor mouse with high DPI precision.',
    keyword: 'mouse',
  },
  {
    id: 'os',
    name: 'Operating System',
    category: ComponentCategory.OS,
    required: false,
    helpText: 'Genuine Windows 11 Home/Pro 64-bit license with DirectStorage support.',
  },
  {
    id: 'accessories',
    name: 'Accessories & Cables',
    category: ComponentCategory.OTHER,
    required: false,
    helpText: 'Thermal paste, cable extensions, anti-sag brackets, and headsets.',
  },
];

export type BuilderSelections = Partial<Record<BuilderSlotId, { product: Product; quantity: number }>>;

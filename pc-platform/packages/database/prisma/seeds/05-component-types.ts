/**
 * Seed: 05-component-types.ts
 * Seeds component type definitions and their spec key schemas.
 * These drive the admin UI for spec data entry validation.
 */

import type { PrismaClient } from '../../src/generated';
import { ComponentType, SpecDataType } from '../../src/generated';

const COMPONENT_TYPES = [
  { type: ComponentType.CPU,         displayName: 'Processor (CPU)',     sortOrder: 1 },
  { type: ComponentType.GPU,         displayName: 'Graphics Card (GPU)', sortOrder: 2 },
  { type: ComponentType.MOTHERBOARD, displayName: 'Motherboard',         sortOrder: 3 },
  { type: ComponentType.RAM,         displayName: 'Memory (RAM)',        sortOrder: 4 },
  { type: ComponentType.STORAGE,     displayName: 'Storage',             sortOrder: 5 },
  { type: ComponentType.PSU,         displayName: 'Power Supply (PSU)',  sortOrder: 6 },
  { type: ComponentType.CASE,        displayName: 'PC Case',             sortOrder: 7 },
  { type: ComponentType.COOLER,      displayName: 'CPU Cooler',          sortOrder: 8 },
  { type: ComponentType.FAN,         displayName: 'Case Fan',            sortOrder: 9 },
  { type: ComponentType.MONITOR,     displayName: 'Monitor',             sortOrder: 10 },
  { type: ComponentType.KEYBOARD,    displayName: 'Keyboard',            sortOrder: 11 },
  { type: ComponentType.MOUSE,       displayName: 'Mouse',               sortOrder: 12 },
  { type: ComponentType.HEADSET,     displayName: 'Headset',             sortOrder: 13 },
];

// Filterable spec definitions per component type
const SPEC_DEFINITIONS: Record<string, Array<{
  key: string; label: string; dataType: SpecDataType; unit?: string; isRequired?: boolean; isFilterable?: boolean; sortOrder: number;
}>> = {
  CPU: [
    { key: 'socket_type',    label: 'Socket',           dataType: SpecDataType.STRING,  isRequired: true,  isFilterable: true,  sortOrder: 1 },
    { key: 'cores',          label: 'Cores',            dataType: SpecDataType.INTEGER, isRequired: true,  isFilterable: true,  sortOrder: 2 },
    { key: 'threads',        label: 'Threads',          dataType: SpecDataType.INTEGER, isRequired: true,  isFilterable: false, sortOrder: 3 },
    { key: 'base_clock_mhz', label: 'Base Clock',       dataType: SpecDataType.INTEGER, unit: 'MHz',       isFilterable: false, sortOrder: 4 },
    { key: 'boost_clock_mhz',label: 'Boost Clock',      dataType: SpecDataType.INTEGER, unit: 'MHz',       isFilterable: true,  sortOrder: 5 },
    { key: 'tdp_w',          label: 'TDP',              dataType: SpecDataType.INTEGER, unit: 'W',         isFilterable: true,  sortOrder: 6 },
    { key: 'mem_type',       label: 'Memory Type',      dataType: SpecDataType.STRING,  isFilterable: true,  sortOrder: 7 },
    { key: 'has_igpu',       label: 'Integrated GPU',   dataType: SpecDataType.BOOLEAN, isFilterable: true,  sortOrder: 8 },
  ],
  GPU: [
    { key: 'vram_gb',        label: 'VRAM',             dataType: SpecDataType.INTEGER, unit: 'GB',        isRequired: true,  isFilterable: true,  sortOrder: 1 },
    { key: 'vram_type',      label: 'VRAM Type',        dataType: SpecDataType.STRING,  isFilterable: true,  sortOrder: 2 },
    { key: 'boost_clock_mhz',label: 'Boost Clock',      dataType: SpecDataType.INTEGER, unit: 'MHz',       isFilterable: false, sortOrder: 3 },
    { key: 'tdp_w',          label: 'TDP',              dataType: SpecDataType.INTEGER, unit: 'W',         isFilterable: true,  sortOrder: 4 },
    { key: 'length_mm',      label: 'Card Length',      dataType: SpecDataType.INTEGER, unit: 'mm',        isFilterable: true,  sortOrder: 5 },
    { key: 'pcie_gen',       label: 'PCIe Generation',  dataType: SpecDataType.INTEGER, isFilterable: true,  sortOrder: 6 },
    { key: 'has_raytracing', label: 'Ray Tracing',      dataType: SpecDataType.BOOLEAN, isFilterable: true,  sortOrder: 7 },
  ],
  MOTHERBOARD: [
    { key: 'socket_type',    label: 'CPU Socket',       dataType: SpecDataType.STRING,  isRequired: true,  isFilterable: true,  sortOrder: 1 },
    { key: 'form_factor',    label: 'Form Factor',      dataType: SpecDataType.STRING,  isRequired: true,  isFilterable: true,  sortOrder: 2 },
    { key: 'chipset',        label: 'Chipset',          dataType: SpecDataType.STRING,  isFilterable: true,  sortOrder: 3 },
    { key: 'ram_slots',      label: 'RAM Slots',        dataType: SpecDataType.INTEGER, isFilterable: true,  sortOrder: 4 },
    { key: 'max_ram_gb',     label: 'Max RAM',          dataType: SpecDataType.INTEGER, unit: 'GB',        isFilterable: true,  sortOrder: 5 },
    { key: 'has_wifi',       label: 'Wi-Fi',            dataType: SpecDataType.BOOLEAN, isFilterable: true,  sortOrder: 6 },
    { key: 'm2_slots',       label: 'M.2 Slots',        dataType: SpecDataType.INTEGER, isFilterable: true,  sortOrder: 7 },
  ],
  RAM: [
    { key: 'mem_type',       label: 'Memory Type',      dataType: SpecDataType.STRING,  isRequired: true,  isFilterable: true,  sortOrder: 1 },
    { key: 'total_capacity_gb', label: 'Total Capacity', dataType: SpecDataType.INTEGER, unit: 'GB',       isRequired: true,  isFilterable: true,  sortOrder: 2 },
    { key: 'speed_mhz',      label: 'Speed',            dataType: SpecDataType.INTEGER, unit: 'MHz',       isFilterable: true,  sortOrder: 3 },
    { key: 'has_rgb',        label: 'RGB',              dataType: SpecDataType.BOOLEAN, isFilterable: true,  sortOrder: 4 },
  ],
  PSU: [
    { key: 'wattage',        label: 'Wattage',          dataType: SpecDataType.INTEGER, unit: 'W',         isRequired: true,  isFilterable: true,  sortOrder: 1 },
    { key: 'efficiency_rating', label: '80+ Rating',   dataType: SpecDataType.STRING,  isFilterable: true,  sortOrder: 2 },
    { key: 'modular',        label: 'Modularity',       dataType: SpecDataType.STRING,  isFilterable: true,  sortOrder: 3 },
  ],
};

export async function seedComponentTypes(prisma: PrismaClient) {
  for (const ct of COMPONENT_TYPES) {
    const record = await prisma.componentType_Def.upsert({
      where: { type: ct.type },
      update: {},
      create: ct,
    });

    const defs = SPEC_DEFINITIONS[ct.type] ?? [];
    for (const def of defs) {
      await prisma.componentSpecDefinition.upsert({
        where: { componentTypeId_key: { componentTypeId: record.id, key: def.key } },
        update: {},
        create: { ...def, componentTypeId: record.id },
      });
    }
  }

  console.log(`  ✔  Component types: ${COMPONENT_TYPES.length} seeded with spec definitions`);
}

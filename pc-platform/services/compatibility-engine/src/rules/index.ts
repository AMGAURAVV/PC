
// Import all 22 rules
import { biosCompatibilityRule } from './bios-compatibility.rule';
import { coolerCaseHeightRule } from './cooler-case-height.rule';
import { coolingRequirementsRule } from './cooling-requirements.rule';
import { cpuChipsetRule } from './cpu-chipset.rule';
import { cpuSocketRule } from './cpu-socket.rule';
import { expansionSlotAvailabilityRule } from './expansion-slot-availability.rule';
import { fanConnectorAvailabilityRule } from './fan-connector-availability.rule';
import { gpuCaseLengthRule } from './gpu-case-length.rule';
import { m2KeyInterfaceRule } from './m2-key-interface.rule';
import { m2SlotAvailabilityRule } from './m2-slot-availability.rule';
import { motherboardCaseFormFactorRule } from './motherboard-case-form-factor.rule';
import { motherboardPowerConnectorsRule } from './motherboard-power-connectors.rule';
import { pcieSlotRequirementsRule } from './pcie-slot-requirements.rule';
import { psuGpuConnectorsRule } from './psu-gpu-connectors.rule';
import { psuHeadroomRule } from './psu-headroom.rule';
import { psuWattageRule } from './psu-wattage.rule';
import { radiatorCaseFitRule } from './radiator-case-fit.rule';
import { ramCapacityRule } from './ram-capacity.rule';
import { ramGenerationRule } from './ram-generation.rule';
import { ramSlotLimitRule } from './ram-slot-limit.rule';
import { ramSpeedRule } from './ram-speed.rule';
import type { CompatibilityRule } from './rule.interface';
import { storageInterfaceRule } from './storage-interface.rule';

export * from './rule.interface';
export * from './cpu-socket.rule';
export * from './cpu-chipset.rule';
export * from './ram-generation.rule';
export * from './ram-capacity.rule';
export * from './ram-slot-limit.rule';
export * from './ram-speed.rule';
export * from './gpu-case-length.rule';
export * from './cooler-case-height.rule';
export * from './radiator-case-fit.rule';
export * from './motherboard-case-form-factor.rule';
export * from './psu-wattage.rule';
export * from './psu-headroom.rule';
export * from './psu-gpu-connectors.rule';
export * from './storage-interface.rule';
export * from './m2-slot-availability.rule';
export * from './m2-key-interface.rule';
export * from './pcie-slot-requirements.rule';
export * from './expansion-slot-availability.rule';
export * from './bios-compatibility.rule';
export * from './fan-connector-availability.rule';
export * from './cooling-requirements.rule';
export * from './motherboard-power-connectors.rule';

// Backwards-compatible aliases
export const caseFormFactorRule = motherboardCaseFormFactorRule;
export const ramTypeRule = ramGenerationRule;

/**
 * All 22 compatibility rules ordered by priority.
 */
export const ALL_COMPATIBILITY_RULES: CompatibilityRule[] = [
  cpuSocketRule,
  cpuChipsetRule,
  ramGenerationRule,
  ramCapacityRule,
  ramSlotLimitRule,
  ramSpeedRule,
  gpuCaseLengthRule,
  coolerCaseHeightRule,
  radiatorCaseFitRule,
  motherboardCaseFormFactorRule,
  psuWattageRule,
  psuHeadroomRule,
  psuGpuConnectorsRule,
  storageInterfaceRule,
  m2SlotAvailabilityRule,
  m2KeyInterfaceRule,
  pcieSlotRequirementsRule,
  expansionSlotAvailabilityRule,
  biosCompatibilityRule,
  fanConnectorAvailabilityRule,
  coolingRequirementsRule,
  motherboardPowerConnectorsRule,
].sort((a, b) => a.priority - b.priority);

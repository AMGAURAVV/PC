import type { BuildComponents } from '@pc-platform/types';
import type { CompatibilityRule, RuleResult } from './rule.interface';

const PSU_HEADROOM_THRESHOLD = 0.8; // Warn if system TDP > 80% of PSU capacity

/**
 * PSU Wattage Rule
 *
 * Calculates estimated system TDP and validates PSU capacity.
 * Generates an error if TDP exceeds PSU wattage.
 * Generates a warning if TDP exceeds 80% of PSU wattage (headroom check).
 */
export const psuWattageRule: CompatibilityRule = {
  id: 'psu-wattage',
  name: 'PSU Wattage Check',
  description:
    'Validates that PSU wattage covers estimated system TDP with appropriate headroom',

  check(components: BuildComponents): RuleResult {
    const { psu, cpu, gpu } = components;

    if (!psu) return { passed: true, issues: [], warnings: [] };

    const psuWattage = psu.specs['wattage'] as number | undefined;
    if (!psuWattage) return { passed: true, issues: [], warnings: [] };

    let estimatedTdp = 50; // Base system overhead (motherboard, RAM, storage)
    if (cpu?.specs['tdp']) estimatedTdp += cpu.specs['tdp'] as number;
    if (gpu?.specs['tdp']) estimatedTdp += gpu.specs['tdp'] as number;

    const issues = [];
    const warnings = [];

    if (estimatedTdp > psuWattage) {
      issues.push({
        severity: 'error' as const,
        rule: 'psu-wattage',
        message: `Estimated system power draw (${estimatedTdp}W) exceeds PSU capacity (${psuWattage}W).`,
        components: [
          psu.productId,
          ...(cpu ? [cpu.productId] : []),
          ...(gpu ? [gpu.productId] : []),
        ],
      });
    } else if (estimatedTdp > psuWattage * PSU_HEADROOM_THRESHOLD) {
      warnings.push({
        severity: 'warning' as const,
        rule: 'psu-wattage',
        message: `Estimated system power draw (${estimatedTdp}W) is above 80% of PSU capacity (${psuWattage}W). Consider a higher wattage PSU for stability and headroom.`,
        components: [psu.productId],
      });
    }

    return {
      passed: issues.length === 0,
      issues,
      warnings,
    };
  },
};

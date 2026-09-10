import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const psuGpuConnectorsRule: CompatibilityRule = {
  id: 'psu-gpu-connectors',
  name: 'PSU PCIe / 12VHPWR GPU Power Connectors',
  description: 'Ensures the power supply provides all necessary dedicated PCIe 8-pin or 16-pin (12VHPWR) power cables for the graphics card',
  category: CompatibilityCategory.CONNECTORS,
  priority: 48,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.psu && !!ctx.normalized.gpu;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const psu = ctx.normalized.psu!;
    const gpu = ctx.normalized.gpu!;
    const gpuPower = gpu.pciePowerConnectors;

    if (!gpuPower) {
      return { passed: true, issues: [], warnings: [] };
    }

    const issues = [];
    const warnings = [];

    // 1. 16-pin 12VHPWR / 12V-2x6 requirement (e.g. RTX 40-series flagship)
    if (gpuPower.pin16Count > 0) {
      if (!psu.has12vhpwr) {
        // High-end cards with 16-pin require 3x or 4x 8-pin PCIe connectors to use the bundled adapter
        const needed8PinForAdapter = gpu.tdpW && gpu.tdpW > 350 ? 4 : 3;
        const available8Pin = psu.pcie8PinCount ?? 2;

        if (available8Pin < needed8PinForAdapter) {
          issues.push({
            severity: 'error' as const,
            category: CompatibilityCategory.CONNECTORS,
            ruleId: 'psu-gpu-connectors',
            rule: 'psu-gpu-connectors',
            title: 'Insufficient PCIe Connectors for 12VHPWR Adapter',
            explanation: `${gpu.name} requires a 16-pin 12VHPWR connection (or an adapter using ${needed8PinForAdapter}x dedicated 8-pin PCIe cables). However, ${psu.name} only provides ${available8Pin}x 8-pin PCIe cables and lacks a native 12VHPWR cable. The GPU cannot be safely powered.`,
            message: `PSU provides ${available8Pin}x 8-pin PCIe cables, but GPU requires native 12VHPWR or ${needed8PinForAdapter}x 8-pin PCIe cables.`,
            affectedComponents: [gpu.productId, psu.productId],
            components: [gpu.productId, psu.productId],
            suggestedResolution: `Select an ATX 3.0 / PCIe 5.0 ready power supply with a native 12VHPWR (16-pin) connector, or a PSU with at least ${needed8PinForAdapter}x 8-pin PCIe cables.`,
          });
        } else {
          warnings.push({
            severity: 'warning' as const,
            category: CompatibilityCategory.CONNECTORS,
            ruleId: 'psu-gpu-connectors',
            rule: 'psu-gpu-connectors',
            title: '16-Pin 12VHPWR Adapter Required',
            explanation: `${gpu.name} uses a 16-pin (12VHPWR) power connector. ${psu.name} does not include a native 16-pin cable, so you must use the ${needed8PinForAdapter}-to-1 8-pin adapter included with the graphics card. Ensure each 8-pin connector uses a separate, non-daisy-chained cable.`,
            message: `Native 12VHPWR connector not found on PSU; will require ${needed8PinForAdapter}x 8-pin adapter cables.`,
            affectedComponents: [gpu.productId, psu.productId],
            components: [gpu.productId, psu.productId],
            suggestedResolution: 'Use individual dedicated 8-pin PCIe power cables for the adapter, or consider an ATX 3.0 power supply.',
          });
        }
      }
    }

    // 2. Standard 8-pin PCIe connector count check
    if (gpuPower.pin8Count > 0) {
      const available8Pin = psu.pcie8PinCount ?? 0;
      if (available8Pin < gpuPower.pin8Count) {
        issues.push({
          severity: 'error' as const,
          category: CompatibilityCategory.CONNECTORS,
          ruleId: 'psu-gpu-connectors',
          rule: 'psu-gpu-connectors',
          title: 'Insufficient PCIe 8-Pin Power Connectors',
          explanation: `${gpu.name} requires ${gpuPower.pin8Count}x 8-pin PCIe power connectors, but ${psu.name} only provides ${available8Pin}x 8-pin connectors. The graphics card cannot receive adequate auxiliary power.`,
          message: `GPU requires ${gpuPower.pin8Count}x 8-pin PCIe connectors; PSU only provides ${available8Pin}.`,
          affectedComponents: [gpu.productId, psu.productId],
          components: [gpu.productId, psu.productId],
          suggestedResolution: `Select a power supply with at least ${gpuPower.pin8Count}x dedicated 8-pin (6+2 pin) PCIe power cables.`,
        });
      }
    }

    return {
      passed: issues.length === 0,
      status: issues.length > 0 ? 'incompatible' : warnings.length > 0 ? 'warning' : 'compatible',
      issues,
      warnings,
    };
  },
};

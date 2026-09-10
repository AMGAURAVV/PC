import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const storageInterfaceRule: CompatibilityRule = {
  id: 'storage-interface',
  name: 'SATA Storage Interface & Port Availability',
  description: 'Ensures the motherboard has sufficient SATA 6Gb/s data ports and the PSU has enough SATA power cables for all installed SATA drives',
  category: CompatibilityCategory.STORAGE,
  priority: 50,

  condition(ctx: RuleContext): boolean {
    return ctx.normalized.storage.length > 0 && !!ctx.normalized.motherboard;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const mb = ctx.normalized.motherboard!;
    const psu = ctx.normalized.psu;
    const sataDrives = ctx.normalized.storage.filter((s) => s.isSata || (!s.isM2 && s.storageType !== 'NVMe SSD'));
    const totalSataDrives = sataDrives.length;

    if (totalSataDrives === 0) {
      return { passed: true, issues: [], warnings: [] };
    }

    const availableSataPorts = mb.sataSlots ?? 4;
    const sataIds = sataDrives.map((s) => s.productId);
    const issues = [];

    // 1. Check Motherboard SATA ports
    if (totalSataDrives > availableSataPorts) {
      issues.push({
        severity: 'error' as const,
        category: CompatibilityCategory.STORAGE,
        ruleId: 'storage-interface',
        rule: 'storage-interface',
        title: 'Insufficient Motherboard SATA Ports',
        explanation: `You have selected ${totalSataDrives} SATA storage drives, but ${mb.name} only provides ${availableSataPorts} SATA ports. There are not enough data ports to connect all drives.`,
        message: `Selected ${totalSataDrives} SATA drives, but motherboard only has ${availableSataPorts} SATA ports.`,
        affectedComponents: [...sataIds, mb.productId],
        components: [...sataIds, mb.productId],
        suggestedResolution: `Reduce the number of SATA drives, switch to M.2 NVMe SSDs, or add a PCIe SATA expansion card.`,
      });
    }

    // 2. Check PSU SATA power connectors
    if (psu && psu.sataPowerConnectors && totalSataDrives > psu.sataPowerConnectors) {
      issues.push({
        severity: 'error' as const,
        category: CompatibilityCategory.STORAGE,
        ruleId: 'storage-interface',
        rule: 'storage-interface',
        title: 'Insufficient PSU SATA Power Cables',
        explanation: `Installed SATA drives (${totalSataDrives}) exceed the number of SATA power connectors provided by ${psu.name} (${psu.sataPowerConnectors}). Drives will lack electrical power.`,
        message: `PSU provides ${psu.sataPowerConnectors} SATA power cables, but ${totalSataDrives} drives require power.`,
        affectedComponents: [...sataIds, psu.productId],
        components: [...sataIds, psu.productId],
        suggestedResolution: 'Use SATA power splitter cables or select a power supply with additional peripheral cables.',
      });
    }

    return {
      passed: issues.length === 0,
      status: issues.length > 0 ? 'incompatible' : 'compatible',
      issues,
      warnings: [],
    };
  },
};

import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const m2KeyInterfaceRule: CompatibilityRule = {
  id: 'm2-key-interface',
  name: 'M.2 Bus Protocol & Keying Compatibility',
  description: 'Validates electrical protocol (NVMe PCIe vs SATA) and physical keying for installed M.2 drives',
  category: CompatibilityCategory.STORAGE,
  priority: 54,

  condition(ctx: RuleContext): boolean {
    return ctx.normalized.storage.some((s) => s.isM2) && !!ctx.normalized.motherboard;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const mb = ctx.normalized.motherboard!;
    const m2Drives = ctx.normalized.storage.filter((s) => s.isM2);
    const issues = [];
    const warnings = [];

    const slotDetails = mb.m2Details || [];
    const hasSataSupportedSlot = slotDetails.some((s) => s.supportsSata);
    const maxMbPcieGen = Math.max(3, ...slotDetails.map((s) => s.pcieGen || 4));

    for (const drive of m2Drives) {
      // 1. SATA M.2 in PCIe-only M.2 slots
      if (drive.isSata && slotDetails.length > 0 && !hasSataSupportedSlot) {
        issues.push({
          severity: 'error' as const,
          category: CompatibilityCategory.STORAGE,
          ruleId: 'm2-key-interface',
          rule: 'm2-key-interface',
          title: 'SATA M.2 Incompatible with PCIe-Only M.2 Sockets',
          explanation: `${drive.name} is an M.2 SATA solid-state drive, but all M.2 slots on ${mb.name} are wired exclusively for PCIe / NVMe protocols. SATA M.2 drives will not be recognized by the BIOS.`,
          message: `SATA M.2 drive (${drive.name}) cannot function in PCIe-only M.2 slots on ${mb.name}.`,
          affectedComponents: [drive.productId, mb.productId],
          components: [drive.productId, mb.productId],
          suggestedResolution: 'Select an NVMe PCIe M.2 SSD, or use a standard 2.5" SATA SSD with a SATA cable.',
        });
      }

      // 2. PCIe generation downgrade warning (e.g. PCIe 5.0 SSD on PCIe 4.0/3.0 motherboard)
      const isPcie5Drive = drive.interface?.includes('PCIe 5') || drive.name.includes('Gen5') || drive.name.includes('PCIe 5.0');
      if (isPcie5Drive && maxMbPcieGen < 5) {
        warnings.push({
          severity: 'warning' as const,
          category: CompatibilityCategory.STORAGE,
          ruleId: 'm2-key-interface',
          rule: 'm2-key-interface',
          title: 'PCIe 5.0 SSD Bus Speed Throttling',
          explanation: `${drive.name} is a PCIe 5.0 x4 SSD capable of ~10,000–14,000 MB/s, but ${mb.name} maximum M.2 slot bandwidth is PCIe ${maxMbPcieGen}.0. The drive will operate normally, but speed will be capped at PCIe ${maxMbPcieGen}.0 limits (~7,500 MB/s).`,
          message: `PCIe 5.0 SSD will run at PCIe ${maxMbPcieGen}.0 throughput on ${mb.name}.`,
          affectedComponents: [drive.productId, mb.productId],
          components: [drive.productId, mb.productId],
          suggestedResolution: 'Select a motherboard with PCIe 5.0 M.2 support to achieve full drive speed, or choose a PCIe 4.0 SSD.',
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

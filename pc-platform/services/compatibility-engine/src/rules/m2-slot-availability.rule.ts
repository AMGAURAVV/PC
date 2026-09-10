import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const m2SlotAvailabilityRule: CompatibilityRule = {
  id: 'm2-slot-availability',
  name: 'M.2 Slot Count Availability',
  description: 'Validates that the motherboard contains sufficient physical M.2 sockets for all installed M.2 solid state drives',
  category: CompatibilityCategory.STORAGE,
  priority: 52,

  condition(ctx: RuleContext): boolean {
    return ctx.normalized.storage.some((s) => s.isM2) && !!ctx.normalized.motherboard;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const mb = ctx.normalized.motherboard!;
    const m2Drives = ctx.normalized.storage.filter((s) => s.isM2);
    const totalM2Drives = m2Drives.length;
    const availableM2Slots = mb.m2Slots ?? (mb.m2Details?.length ?? 2);
    const m2Ids = m2Drives.map((d) => d.productId);

    if (totalM2Drives > availableM2Slots) {
      return {
        passed: false,
        status: 'incompatible',
        issues: [
          {
            severity: 'error',
            category: CompatibilityCategory.STORAGE,
            ruleId: 'm2-slot-availability',
            rule: 'm2-slot-availability',
            title: 'Exceeded Available M.2 Sockets',
            explanation: `You have selected ${totalM2Drives} M.2 solid-state drives, but ${mb.name} only provides ${availableM2Slots} onboard M.2 slot(s). There are physically not enough M.2 sockets on the motherboard to seat all drives.`,
            message: `Selected ${totalM2Drives} M.2 SSDs, but motherboard only features ${availableM2Slots} M.2 socket(s).`,
            affectedComponents: [...m2Ids, mb.productId],
            components: [...m2Ids, mb.productId],
            suggestedResolution: `Reduce the number of M.2 drives by using higher-capacity SSDs (e.g. one 2TB SSD instead of two 1TB SSDs), or choose a motherboard with at least ${totalM2Drives} M.2 slots.`,
          },
        ],
        warnings: [],
      };
    }

    return { passed: true, issues: [], warnings: [] };
  },
};

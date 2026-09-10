import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const ramSlotLimitRule: CompatibilityRule = {
  id: 'ram-slot-limit',
  name: 'Motherboard RAM Slot Limit',
  description: 'Ensures the number of physical RAM sticks does not exceed available DIMM slots on the motherboard',
  category: CompatibilityCategory.MEMORY,
  priority: 26,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.motherboard && ctx.normalized.ram.length > 0;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const mb = ctx.normalized.motherboard!;
    const availableSlots = mb.ramSlots ?? 4;
    const totalSticks = ctx.computed.totalRamSticks;
    const ramIds = ctx.normalized.ram.map((r) => r.productId);

    if (totalSticks > availableSlots) {
      return {
        passed: false,
        status: 'incompatible',
        issues: [
          {
            severity: 'error',
            category: CompatibilityCategory.MEMORY,
            ruleId: 'ram-slot-limit',
            rule: 'ram-slot-limit',
            title: 'Exceeded Motherboard RAM Slot Count',
            explanation: `You have selected ${totalSticks} physical RAM sticks across your memory kits, but ${mb.name} only has ${availableSlots} physical DIMM slots. There are not enough physical slots to insert all modules.`,
            message: `Selected ${totalSticks} RAM sticks, but motherboard only provides ${availableSlots} DIMM slots.`,
            affectedComponents: [...ramIds, mb.productId],
            components: [...ramIds, mb.productId],
            suggestedResolution: `Choose higher-capacity sticks in a kit of ${availableSlots} or fewer modules (e.g. 2x32GB instead of 4x16GB).`,
          },
        ],
        warnings: [],
      };
    }

    return { passed: true, issues: [], warnings: [] };
  },
};

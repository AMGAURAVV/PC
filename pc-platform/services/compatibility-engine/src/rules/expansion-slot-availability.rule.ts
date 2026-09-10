import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const expansionSlotAvailabilityRule: CompatibilityRule = {
  id: 'expansion-slot-availability',
  name: 'Case Rear Expansion Bracket Slot Availability',
  description: 'Validates that total bracket slot width for the GPU and expansion cards fits within the case rear expansion slots',
  category: CompatibilityCategory.EXPANSION,
  priority: 58,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.case && (!!ctx.normalized.gpu || ctx.normalized.expansionCards.length > 0);
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const pcCase = ctx.normalized.case!;
    const gpu = ctx.normalized.gpu;
    const cards = ctx.normalized.expansionCards;

    const availableCaseSlots = pcCase.pciSlots ?? 7;
    const totalSlotsUsed = ctx.computed.totalPciSlotsUsed;

    if (totalSlotsUsed > availableCaseSlots) {
      const affected = [pcCase.productId];
      if (gpu) affected.push(gpu.productId);
      cards.forEach((c) => affected.push(c.productId));

      return {
        passed: false,
        status: 'incompatible',
        issues: [
          {
            severity: 'error',
            category: CompatibilityCategory.EXPANSION,
            ruleId: 'expansion-slot-availability',
            rule: 'expansion-slot-availability',
            title: 'Exceeded Case Expansion Slots',
            explanation: `Your installed components require ${totalSlotsUsed} rear expansion bracket slots (GPU requires ${gpu?.slotWidth ?? 2} slots, plus ${cards.length} expansion card(s)), but ${pcCase.name} only provides ${availableCaseSlots} rear PCI slots. Components will block each other or extend beyond the chassis frame.`,
            message: `Requires ${totalSlotsUsed} expansion slots, but chassis only has ${availableCaseSlots} slots.`,
            affectedComponents: affected,
            components: affected,
            suggestedResolution: `Choose a larger chassis with more expansion slots (e.g. standard ATX or full-tower), or choose a slimmer graphics card.`,
          },
        ],
        warnings: [],
      };
    }

    return { passed: true, issues: [], warnings: [] };
  },
};

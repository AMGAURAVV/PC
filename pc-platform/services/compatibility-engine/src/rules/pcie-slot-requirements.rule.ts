import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const pcieSlotRequirementsRule: CompatibilityRule = {
  id: 'pcie-slot-requirements',
  name: 'PCIe Slot Availability & Lane Requirements',
  description: 'Validates that the motherboard has sufficient physical and electrical PCIe slots for the GPU and all expansion cards',
  category: CompatibilityCategory.EXPANSION,
  priority: 56,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.motherboard && (!!ctx.normalized.gpu || ctx.normalized.expansionCards.length > 0);
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const mb = ctx.normalized.motherboard!;
    const gpu = ctx.normalized.gpu;
    const cards = ctx.normalized.expansionCards;

    const issues = [];
    const availableX16 = mb.pcieX16Slots ?? 1;
    const availableX4 = mb.pcieX4Slots ?? 0;
    const availableX1 = mb.pcieX1Slots ?? 0;
    const totalSlotsAvailable = availableX16 + availableX4 + availableX1;

    // 1. GPU requires at least one PCIe x16 physical slot
    if (gpu && availableX16 < 1) {
      issues.push({
        severity: 'error' as const,
        category: CompatibilityCategory.EXPANSION,
        ruleId: 'pcie-slot-requirements',
        rule: 'pcie-slot-requirements',
        title: 'Missing PCIe x16 Slot for Graphics Card',
        explanation: `${gpu.name} requires a physical PCIe x16 slot, but ${mb.name} does not have any PCIe x16 slots available.`,
        message: `Motherboard lacks required PCIe x16 slot for ${gpu.name}.`,
        affectedComponents: [gpu.productId, mb.productId],
        components: [gpu.productId, mb.productId],
        suggestedResolution: 'Select a motherboard that includes at least one full-length PCIe x16 slot.',
      });
    }

    // 2. Tally full-length x16 expansion cards
    const x16CardsNeeded = (gpu ? 1 : 0) + cards.filter((c) => c.requiredPcieSlotWidth === 'x16').length;
    if (x16CardsNeeded > availableX16) {
      const affected = [mb.productId];
      if (gpu) affected.push(gpu.productId);
      cards.forEach((c) => affected.push(c.productId));

      issues.push({
        severity: 'error' as const,
        category: CompatibilityCategory.EXPANSION,
        ruleId: 'pcie-slot-requirements',
        rule: 'pcie-slot-requirements',
        title: 'Insufficient PCIe x16 Slots',
        explanation: `Your configuration requires ${x16CardsNeeded}x PCIe x16 slots (including graphics card and full-length add-in cards), but ${mb.name} only provides ${availableX16}x PCIe x16 slot(s).`,
        message: `Required ${x16CardsNeeded}x PCIe x16 slots, but motherboard only features ${availableX16}.`,
        affectedComponents: affected,
        components: affected,
        suggestedResolution: 'Select a motherboard with multiple PCIe x16 slots or use USB/M.2 based expansion alternatives.',
      });
    }

    // 3. Total card count vs total motherboard slots
    const totalCards = (gpu ? 1 : 0) + cards.length;
    if (totalCards > totalSlotsAvailable) {
      const affected = [mb.productId];
      if (gpu) affected.push(gpu.productId);
      cards.forEach((c) => affected.push(c.productId));

      issues.push({
        severity: 'error' as const,
        category: CompatibilityCategory.EXPANSION,
        ruleId: 'pcie-slot-requirements',
        rule: 'pcie-slot-requirements',
        title: 'Insufficient Total PCIe Slots on Motherboard',
        explanation: `Installed cards (${totalCards} total) exceed total motherboard PCIe slots (${totalSlotsAvailable}). There are physically not enough slots to mount all components.`,
        message: `Selected ${totalCards} PCIe cards, but motherboard only offers ${totalSlotsAvailable} total slots.`,
        affectedComponents: affected,
        components: affected,
        suggestedResolution: 'Remove extra expansion cards or choose an ATX motherboard with more expansion slots.',
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

import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const fanConnectorAvailabilityRule: CompatibilityRule = {
  id: 'fan-connector-availability',
  name: 'Fan Header & Splitter Availability',
  description: 'Checks whether the motherboard has sufficient PWM/DC 4-pin fan headers for all installed case and radiator fans',
  category: CompatibilityCategory.CONNECTORS,
  priority: 65,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.motherboard && (ctx.normalized.fans.length > 0 || !!ctx.normalized.cpuCooler);
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const mb = ctx.normalized.motherboard!;
    const totalFans = ctx.computed.totalFanCount;
    const availableHeaders = mb.fanHeaders ?? 3; // Standard average default if unlisted
    const warnings = [];

    if (totalFans > availableHeaders) {
      warnings.push({
        severity: 'warning' as const,
        category: CompatibilityCategory.CONNECTORS,
        ruleId: 'fan-connector-availability',
        rule: 'fan-connector-availability',
        title: 'Fan Count Exceeds Motherboard Fan Headers (Splitter/Hub Required)',
        explanation: `Your configuration includes ${totalFans} cooling fans (case fans and CPU cooler fans), but ${mb.name} provides approximately ${availableHeaders} fan headers. You will need fan splitter Y-cables or a powered fan hub / controller to power all fans simultaneously.`,
        message: `${totalFans} fans exceed ${availableHeaders} available motherboard fan headers. Fan splitter or hub required.`,
        affectedComponents: [mb.productId, ...ctx.normalized.fans.map((f) => f.productId)],
        components: [mb.productId, ...ctx.normalized.fans.map((f) => f.productId)],
        suggestedResolution: 'Add a 4-pin PWM fan splitter cable or a SATA-powered fan hub to connect all fans.',
      });
    }

    return {
      passed: true,
      status: warnings.length > 0 ? 'warning' : 'compatible',
      issues: [],
      warnings,
    };
  },
};

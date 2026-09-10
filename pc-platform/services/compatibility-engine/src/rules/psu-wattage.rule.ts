import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const psuWattageRule: CompatibilityRule = {
  id: 'psu-wattage',
  name: 'PSU Continuous Wattage Capacity',
  description: 'Validates that the power supply continuous rated output meets or exceeds the total estimated peak system power draw',
  category: CompatibilityCategory.POWER,
  priority: 45,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.psu && (!!ctx.normalized.cpu || !!ctx.normalized.gpu);
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const psu = ctx.normalized.psu!;
    const estimatedTdpW = ctx.computed.estimatedSystemTdpW;

    if (!psu.wattage) {
      return {
        passed: false,
        status: 'unknown',
        issues: [
          {
            severity: 'unknown',
            category: CompatibilityCategory.POWER,
            ruleId: 'psu-wattage',
            rule: 'psu-wattage',
            title: 'Unknown PSU Wattage Specification',
            explanation: `Power supply ${psu.name} does not have a rated continuous wattage specified.`,
            message: `Missing wattage rating for ${psu.name}.`,
            affectedComponents: [psu.productId],
            components: [psu.productId],
            suggestedResolution: 'Specify continuous wattage rating (e.g. 750W, 850W, 1000W).',
          },
        ],
        warnings: [],
      };
    }

    if (estimatedTdpW > psu.wattage) {
      const affected = [psu.productId];
      if (ctx.normalized.cpu) affected.push(ctx.normalized.cpu.productId);
      if (ctx.normalized.gpu) affected.push(ctx.normalized.gpu.productId);

      return {
        passed: false,
        status: 'incompatible',
        issues: [
          {
            severity: 'error',
            category: CompatibilityCategory.POWER,
            ruleId: 'psu-wattage',
            rule: 'psu-wattage',
            title: 'PSU Wattage Deficit (System Power Draw Exceeds Capacity)',
            explanation: `The estimated peak system power draw (${estimatedTdpW}W) exceeds the continuous rated wattage of ${psu.name} (${psu.wattage}W). Under gaming or computational load, the system will trigger Over-Power Protection (OPP), shutdown unexpectedly, or fail to boot.`,
            message: `Estimated power draw (${estimatedTdpW}W) exceeds PSU capacity (${psu.wattage}W).`,
            affectedComponents: affected,
            components: affected,
            suggestedResolution: `Upgrade to a power supply with at least ${ctx.computed.recommendedPsuWattageW}W continuous capacity.`,
          },
        ],
        warnings: [],
      };
    }

    return { passed: true, issues: [], warnings: [] };
  },
};

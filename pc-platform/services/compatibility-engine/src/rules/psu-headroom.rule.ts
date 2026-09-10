import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const psuHeadroomRule: CompatibilityRule = {
  id: 'psu-headroom',
  name: 'PSU Headroom & Efficiency Sizing',
  description: 'Validates that the power supply provides recommended 20–25% headroom for transient spikes and aligns with GPU vendor guidelines',
  category: CompatibilityCategory.POWER,
  priority: 46,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.psu && !!ctx.normalized.psu.wattage;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const psu = ctx.normalized.psu!;
    const gpu = ctx.normalized.gpu;
    const psuWattage = psu.wattage!;
    const estimatedTdpW = ctx.computed.estimatedSystemTdpW;
    const warnings = [];

    // 1. 80% capacity threshold check (20% headroom)
    const loadPercentage = Math.round((estimatedTdpW / psuWattage) * 100);
    if (loadPercentage > 80 && estimatedTdpW <= psuWattage) {
      warnings.push({
        severity: 'warning' as const,
        category: CompatibilityCategory.POWER,
        ruleId: 'psu-headroom',
        rule: 'psu-headroom',
        title: 'Tight Power Supply Headroom (<20% Reserve)',
        explanation: `Estimated system load (${estimatedTdpW}W) represents ${loadPercentage}% of PSU rated capacity (${psuWattage}W). Modern CPUs and GPUs generate brief millisecond transient power spikes that can exceed baseline wattage. Running above 80% also reduces efficiency and causes louder fan operation.`,
        message: `System draw (${estimatedTdpW}W) utilizes ${loadPercentage}% of ${psuWattage}W PSU capacity. Recommended: ≥${ctx.computed.recommendedPsuWattageW}W.`,
        affectedComponents: [psu.productId],
        components: [psu.productId],
        suggestedResolution: `Consider upgrading to a ${ctx.computed.recommendedPsuWattageW}W or higher power supply for optimal efficiency and headroom.`,
      });
    }

    // 2. GPU vendor recommended PSU check
    if (gpu?.recommendedPsuW && psuWattage < gpu.recommendedPsuW && estimatedTdpW <= psuWattage) {
      warnings.push({
        severity: 'warning' as const,
        category: CompatibilityCategory.POWER,
        ruleId: 'psu-headroom',
        rule: 'psu-headroom',
        title: 'PSU Below GPU Manufacturer Recommendation',
        explanation: `${gpu.name} manufacturer recommends a minimum ${gpu.recommendedPsuW}W power supply to account for transient voltage spikes, but the selected PSU provides ${psuWattage}W.`,
        message: `GPU recommends ${gpu.recommendedPsuW}W PSU; selected PSU provides ${psuWattage}W.`,
        affectedComponents: [gpu.productId, psu.productId],
        components: [gpu.productId, psu.productId],
        suggestedResolution: `Consider a PSU rated at least ${gpu.recommendedPsuW}W as advised by the GPU manufacturer.`,
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

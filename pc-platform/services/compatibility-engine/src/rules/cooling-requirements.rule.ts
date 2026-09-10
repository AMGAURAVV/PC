import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const coolingRequirementsRule: CompatibilityRule = {
  id: 'cooling-requirements',
  name: 'CPU Cooler Mounting Socket & TDP Rating',
  description: 'Verifies cooler physical socket bracket compatibility and thermal dissipation capacity against CPU thermal design power',
  category: CompatibilityCategory.COOLING,
  priority: 70,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.cpu;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const cpu = ctx.normalized.cpu!;
    const cooler = ctx.normalized.cpuCooler;
    const issues = [];
    const warnings = [];

    // 1. Missing CPU cooler check (if CPU does not include stock cooler)
    if (!cooler) {
      if (!cpu.coolerIncluded) {
        warnings.push({
          severity: 'warning' as const,
          category: CompatibilityCategory.COOLING,
          ruleId: 'cooling-requirements',
          rule: 'cooling-requirements',
          title: 'No CPU Cooler Selected (CPU Does Not Include Stock Cooler)',
          explanation: `${cpu.name} does not include a factory CPU cooler in the retail packaging. A dedicated aftermarket air cooler or AIO liquid cooler must be purchased separately.`,
          message: `${cpu.name} does not include a stock heatsink. Add a CPU cooler to your build.`,
          affectedComponents: [cpu.productId],
          components: [cpu.productId],
          suggestedResolution: 'Select an air cooler or AIO liquid cooler to prevent CPU thermal shutdown.',
        });
      }
      return {
        passed: true,
        status: warnings.length > 0 ? 'warning' : 'compatible',
        issues: [],
        warnings,
      };
    }

    // 2. Socket bracket compatibility
    if (cpu.socketType && cooler.supportedSockets.length > 0) {
      const isSocketSupported = cooler.supportedSockets.some((s) => s.toUpperCase() === cpu.socketType!.toUpperCase());
      if (!isSocketSupported) {
        issues.push({
          severity: 'error' as const,
          category: CompatibilityCategory.COOLING,
          ruleId: 'cooling-requirements',
          rule: 'cooling-requirements',
          title: 'Cooler Lacks Mounting Bracket for CPU Socket',
          explanation: `${cooler.name} does not list mounting hardware support for socket ${cpu.socketType}. Supported sockets are: ${cooler.supportedSockets.join(', ')}. The cooler cannot be fastened to the motherboard.`,
          message: `${cooler.name} does not support socket ${cpu.socketType}.`,
          affectedComponents: [cooler.productId, cpu.productId],
          components: [cooler.productId, cpu.productId],
          suggestedResolution: `Choose a cooler that supports socket ${cpu.socketType}, or verify if an adapter bracket is available from the manufacturer.`,
        });
      }
    }

    // 3. TDP rating adequacy
    if (cooler.tdpRatingW && (cpu.tdpW || cpu.maxTdpW)) {
      const cpuBaseTdp = cpu.tdpW || 65;
      const cpuPeakTdp = cpu.maxTdpW || cpuBaseTdp;

      if (cooler.tdpRatingW < cpuBaseTdp) {
        issues.push({
          severity: 'error' as const,
          category: CompatibilityCategory.COOLING,
          ruleId: 'cooling-requirements',
          rule: 'cooling-requirements',
          title: 'Insufficient Cooler Thermal Capacity (Severe Thermal Throttling)',
          explanation: `${cpu.name} has a baseline TDP of ${cpuBaseTdp}W, but ${cooler.name} is only rated for ${cooler.tdpRatingW}W of heat dissipation. The processor will experience severe thermal throttling and reach thermal limit under ordinary operation.`,
          message: `Cooler capacity (${cooler.tdpRatingW}W) is lower than CPU base TDP (${cpuBaseTdp}W).`,
          affectedComponents: [cooler.productId, cpu.productId],
          components: [cooler.productId, cpu.productId],
          suggestedResolution: `Upgrade to a cooler rated for at least ${cpuPeakTdp}W TDP.`,
        });
      } else if (cooler.tdpRatingW < cpuPeakTdp) {
        warnings.push({
          severity: 'warning' as const,
          category: CompatibilityCategory.COOLING,
          ruleId: 'cooling-requirements',
          rule: 'cooling-requirements',
          title: 'Cooler May Limit Peak Boost Clocks',
          explanation: `${cooler.name} rated capacity (${cooler.tdpRatingW}W) covers base CPU TDP (${cpuBaseTdp}W), but is below the CPU peak boost power draw (${cpuPeakTdp}W). The CPU may throttle boost clocks during sustained heavy workloads.`,
          message: `Cooler rating (${cooler.tdpRatingW}W) is below CPU peak PPT/PL2 (${cpuPeakTdp}W).`,
          affectedComponents: [cooler.productId, cpu.productId],
          components: [cooler.productId, cpu.productId],
          suggestedResolution: `Consider a higher-performance cooler (e.g. dual-tower air cooler or 240mm/360mm AIO) for maximum sustained performance.`,
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

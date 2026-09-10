import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const motherboardPowerConnectorsRule: CompatibilityRule = {
  id: 'motherboard-power-connectors',
  name: 'Motherboard EPS 12V CPU Power Connectors',
  description: 'Ensures the power supply provides sufficient 8-pin (4+4 pin) EPS 12V cables to power the motherboard CPU socket',
  category: CompatibilityCategory.CONNECTORS,
  priority: 75,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.motherboard && !!ctx.normalized.psu;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const mb = ctx.normalized.motherboard!;
    const psu = ctx.normalized.psu!;
    const cpu = ctx.normalized.cpu;

    const issues = [];
    const warnings = [];

    const mbConnectors = mb.cpuPowerConnectors || ['8-pin'];
    const psuEpsCount = psu.eps12vConnectors ?? 1;

    // 1. Zero EPS connectors from PSU
    if (psuEpsCount < 1) {
      issues.push({
        severity: 'error' as const,
        category: CompatibilityCategory.CONNECTORS,
        ruleId: 'motherboard-power-connectors',
        rule: 'motherboard-power-connectors',
        title: 'Missing CPU 8-Pin EPS Power Cable',
        explanation: `${mb.name} requires at least one 8-pin EPS 12V CPU power connector, but ${psu.name} does not provide any EPS connectors. The system cannot power the CPU.`,
        message: `PSU lacks required CPU EPS 12V power cable for ${mb.name}.`,
        affectedComponents: [mb.productId, psu.productId],
        components: [mb.productId, psu.productId],
        suggestedResolution: 'Select a power supply with at least one 8-pin (4+4 pin) EPS CPU power cable.',
      });
    }

    // 2. High TDP CPU with Dual 8-pin Motherboard EPS requirement
    const hasDualEpsMb = mbConnectors.length >= 2;
    const isHighTdpCpu = (cpu?.maxTdpW ?? cpu?.tdpW ?? 65) >= 200;

    if (hasDualEpsMb && psuEpsCount < 2) {
      if (isHighTdpCpu) {
        warnings.push({
          severity: 'warning' as const,
          category: CompatibilityCategory.CONNECTORS,
          ruleId: 'motherboard-power-connectors',
          rule: 'motherboard-power-connectors',
          title: 'Second EPS 8-Pin Cable Recommended for High-Power CPU',
          explanation: `${mb.name} features dual 8-pin EPS CPU power inputs. ${cpu?.name ?? 'The selected processor'} has a peak power draw exceeding 200W. While the motherboard may boot with a single 8-pin cable, connecting the second EPS 8-pin cable from ${psu.name} is strongly recommended to prevent excessive cable heating and voltage drop during full load.`,
          message: `Motherboard provides dual 8-pin EPS inputs; PSU only provides 1x 8-pin cable. Recommended 2x 8-pin for ${cpu?.name ?? 'high TDP CPU'}.`,
          affectedComponents: [mb.productId, psu.productId, ...(cpu ? [cpu.productId] : [])],
          components: [mb.productId, psu.productId, ...(cpu ? [cpu.productId] : [])],
          suggestedResolution: 'Consider a power supply with dual EPS 8-pin (4+4 pin) CPU cables for high-wattage processors.',
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

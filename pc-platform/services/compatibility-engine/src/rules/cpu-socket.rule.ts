import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const cpuSocketRule: CompatibilityRule = {
  id: 'cpu-socket',
  name: 'CPU Socket Compatibility',
  description: 'Ensures the CPU physical socket type matches the motherboard socket',
  category: CompatibilityCategory.SOCKET,
  priority: 10,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.cpu && !!ctx.normalized.motherboard;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const cpu = ctx.normalized.cpu!;
    const mb = ctx.normalized.motherboard!;

    // Check for missing data
    if (!cpu.socketType || !mb.socketType) {
      return {
        passed: false,
        status: 'unknown',
        issues: [
          {
            severity: 'unknown',
            category: CompatibilityCategory.SOCKET,
            ruleId: 'cpu-socket',
            rule: 'cpu-socket',
            title: 'Unknown Socket Compatibility (Missing Data)',
            explanation: `Unable to verify CPU and motherboard socket compatibility because specification data is missing (CPU socket: ${cpu.socketType ?? 'missing'}, Motherboard socket: ${mb.socketType ?? 'missing'}).`,
            message: `Unable to verify socket compatibility due to missing data.`,
            affectedComponents: [cpu.productId, mb.productId],
            components: [cpu.productId, mb.productId],
            suggestedResolution: 'Verify and populate socket specifications for both the CPU and the motherboard.',
          },
        ],
        warnings: [],
      };
    }

    if (cpu.socketType !== mb.socketType) {
      return {
        passed: false,
        status: 'incompatible',
        issues: [
          {
            severity: 'error',
            category: CompatibilityCategory.SOCKET,
            ruleId: 'cpu-socket',
            rule: 'cpu-socket',
            title: 'CPU and Motherboard Socket Mismatch',
            explanation: `${cpu.name} requires socket ${cpu.socketType}, but ${mb.name} features socket ${mb.socketType}. The processor cannot physically mount into this motherboard.`,
            message: `${cpu.name} (${cpu.socketType}) is incompatible with ${mb.name} (${mb.socketType}).`,
            affectedComponents: [cpu.productId, mb.productId],
            components: [cpu.productId, mb.productId],
            suggestedResolution: `Choose a motherboard with a ${cpu.socketType} socket, or choose a CPU compatible with ${mb.socketType}.`,
          },
        ],
        warnings: [],
      };
    }

    return { passed: true, issues: [], warnings: [] };
  },
};

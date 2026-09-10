import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const ramCapacityRule: CompatibilityRule = {
  id: 'ram-capacity',
  name: 'RAM Capacity Limit',
  description: 'Validates that total installed memory capacity does not exceed motherboard or CPU memory controller limits',
  category: CompatibilityCategory.MEMORY,
  priority: 25,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.motherboard && ctx.normalized.ram.length > 0;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const mb = ctx.normalized.motherboard!;
    const cpu = ctx.normalized.cpu;
    const totalCapacityGb = ctx.computed.totalRamCapacityGb;
    const ramIds = ctx.normalized.ram.map((r) => r.productId);

    const issues = [];
    const warnings = [];

    // Motherboard max RAM check
    if (mb.maxRamGb && totalCapacityGb > mb.maxRamGb) {
      issues.push({
        severity: 'error' as const,
        category: CompatibilityCategory.MEMORY,
        ruleId: 'ram-capacity',
        rule: 'ram-capacity',
        title: 'Motherboard Maximum RAM Capacity Exceeded',
        explanation: `Total installed RAM (${totalCapacityGb}GB) exceeds the maximum capacity supported by ${mb.name} (${mb.maxRamGb}GB). The system will fail to POST or will not recognize memory beyond ${mb.maxRamGb}GB.`,
        message: `Total RAM (${totalCapacityGb}GB) exceeds motherboard limit of ${mb.maxRamGb}GB.`,
        affectedComponents: [...ramIds, mb.productId],
        components: [...ramIds, mb.productId],
        suggestedResolution: `Reduce total RAM capacity to ${mb.maxRamGb}GB or fewer, or select a motherboard with a higher memory limit.`,
      });
    }

    // CPU max memory check
    if (cpu?.maxMemoryGb && totalCapacityGb > cpu.maxMemoryGb) {
      warnings.push({
        severity: 'warning' as const,
        category: CompatibilityCategory.MEMORY,
        ruleId: 'ram-capacity',
        rule: 'ram-capacity',
        title: 'CPU Memory Controller Capacity Exceeded',
        explanation: `Total installed RAM (${totalCapacityGb}GB) exceeds ${cpu.name} rated maximum addressable memory (${cpu.maxMemoryGb}GB). Memory may operate at reduced capacity or require specific BIOS configurations.`,
        message: `Total RAM (${totalCapacityGb}GB) exceeds CPU memory controller limit of ${cpu.maxMemoryGb}GB.`,
        affectedComponents: [...ramIds, cpu.productId],
        components: [...ramIds, cpu.productId],
        suggestedResolution: `Verify CPU specifications or configure memory to ${cpu.maxMemoryGb}GB.`,
      });
    }

    return {
      passed: issues.length === 0,
      status: issues.length > 0 ? 'incompatible' : warnings.length > 0 ? 'warning' : 'compatible',
      issues,
      warnings,
    };
  },
};

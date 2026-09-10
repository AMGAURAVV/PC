import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const ramGenerationRule: CompatibilityRule = {
  id: 'ram-generation',
  name: 'RAM Generation Compatibility',
  description: 'Ensures RAM memory generation (DDR4, DDR5) matches motherboard and CPU specifications',
  category: CompatibilityCategory.MEMORY,
  priority: 20,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.motherboard && ctx.normalized.ram.length > 0;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const mb = ctx.normalized.motherboard!;
    const ramList = ctx.normalized.ram;
    const cpu = ctx.normalized.cpu;

    const issues = [];
    const warnings = [];

    for (const stick of ramList) {
      if (!stick.memType) {
        warnings.push({
          severity: 'unknown' as const,
          category: CompatibilityCategory.MEMORY,
          ruleId: 'ram-generation',
          rule: 'ram-generation',
          title: 'Unknown RAM Generation (Missing Data)',
          explanation: `Memory kit ${stick.name} does not specify memory generation (e.g., DDR4 or DDR5). Compatibility cannot be guaranteed.`,
          message: `Missing memory generation for ${stick.name}.`,
          affectedComponents: [stick.productId],
          components: [stick.productId],
          suggestedResolution: 'Specify the DDR generation (e.g. DDR5, DDR4) for this memory product.',
        });
        continue;
      }

      // Check against motherboard supported memory types
      const mbSupports = mb.supportedMemTypes.length > 0 ? mb.supportedMemTypes : ['DDR5'];
      const isSupportedByMb = mbSupports.some((supported) => supported.toUpperCase() === stick.memType!.toUpperCase());

      if (!isSupportedByMb) {
        issues.push({
          severity: 'error' as const,
          category: CompatibilityCategory.MEMORY,
          ruleId: 'ram-generation',
          rule: 'ram-generation',
          title: 'RAM Memory Generation Mismatch',
          explanation: `${stick.name} is ${stick.memType}, but ${mb.name} only supports ${mbSupports.join(', ')}. Different DDR generations have incompatible pin layouts and electrical voltages and cannot be keyed into the slot.`,
          message: `${stick.name} (${stick.memType}) cannot be installed in ${mb.name} (supports ${mbSupports.join(', ')}).`,
          affectedComponents: [stick.productId, mb.productId],
          components: [stick.productId, mb.productId],
          suggestedResolution: `Choose a RAM kit with ${mbSupports.join(' or ')} memory type, or choose a motherboard supporting ${stick.memType}.`,
        });
      }

      // Check against CPU if CPU strictly requires a specific generation
      if (cpu?.memoryType && cpu.memoryType.toUpperCase() !== stick.memType.toUpperCase()) {
        // Some CPUs support both (e.g. Intel 13th Gen supports DDR4 and DDR5, depending on board),
        // but if CPU is AM5, it strictly only supports DDR5.
        if (cpu.socketType === 'AM5' && stick.memType !== 'DDR5') {
          issues.push({
            severity: 'error' as const,
            category: CompatibilityCategory.MEMORY,
            ruleId: 'ram-generation',
            rule: 'ram-generation',
            title: 'CPU Memory Controller Generation Mismatch',
            explanation: `${cpu.name} integrated memory controller strictly requires DDR5 memory, but ${stick.name} is ${stick.memType}.`,
            message: `${cpu.name} requires DDR5; ${stick.name} is ${stick.memType}.`,
            affectedComponents: [stick.productId, cpu.productId],
            components: [stick.productId, cpu.productId],
            suggestedResolution: `Select a DDR5 memory kit for ${cpu.name}.`,
          });
        }
      }
    }

    return {
      passed: issues.length === 0,
      status: issues.length > 0 ? 'incompatible' : warnings.length > 0 ? 'unknown' : 'compatible',
      issues,
      warnings,
    };
  },
};

import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const coolerCaseHeightRule: CompatibilityRule = {
  id: 'cooler-case-height',
  name: 'CPU Cooler Height Clearance',
  description: 'Ensures the physical height of an air CPU cooler does not exceed the side-panel clearance of the case',
  category: CompatibilityCategory.PHYSICAL_CLEARANCE,
  priority: 35,

  condition(ctx: RuleContext): boolean {
    const cooler = ctx.normalized.cpuCooler;
    return !!cooler && cooler.coolerType === 'Air' && !!ctx.normalized.case;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const cooler = ctx.normalized.cpuCooler!;
    const pcCase = ctx.normalized.case!;

    if (!cooler.heightMm || !pcCase.maxCpuCoolerHeightMm) {
      return {
        passed: false,
        status: 'unknown',
        issues: [
          {
            severity: 'unknown',
            category: CompatibilityCategory.PHYSICAL_CLEARANCE,
            ruleId: 'cooler-case-height',
            rule: 'cooler-case-height',
            title: 'Unknown Cooler Height Clearance Specification',
            explanation: `Unable to verify air cooler height clearance: Cooler height is ${cooler.heightMm ? `${cooler.heightMm}mm` : 'missing'} and case max cooler height is ${pcCase.maxCpuCoolerHeightMm ? `${pcCase.maxCpuCoolerHeightMm}mm` : 'missing'}.`,
            message: `Missing dimensions for CPU cooler height verification.`,
            affectedComponents: [cooler.productId, pcCase.productId],
            components: [cooler.productId, pcCase.productId],
            suggestedResolution: 'Specify air cooler height and chassis maximum cooler clearance.',
          },
        ],
        warnings: [],
      };
    }

    if (cooler.heightMm > pcCase.maxCpuCoolerHeightMm) {
      return {
        passed: false,
        status: 'incompatible',
        issues: [
          {
            severity: 'error',
            category: CompatibilityCategory.PHYSICAL_CLEARANCE,
            ruleId: 'cooler-case-height',
            rule: 'cooler-case-height',
            title: 'CPU Air Cooler Too Tall for Case',
            explanation: `The CPU cooler ${cooler.name} stands ${cooler.heightMm}mm tall, but ${pcCase.name} only allows a maximum cooler height of ${pcCase.maxCpuCoolerHeightMm}mm. The case side panel or tempered glass cannot be closed.`,
            message: `Cooler height (${cooler.heightMm}mm) exceeds case side clearance (${pcCase.maxCpuCoolerHeightMm}mm).`,
            affectedComponents: [cooler.productId, pcCase.productId],
            components: [cooler.productId, pcCase.productId],
            suggestedResolution: `Select a lower-profile CPU cooler (≤${pcCase.maxCpuCoolerHeightMm}mm) or an AIO liquid cooler, or choose a wider case.`,
          },
        ],
        warnings: [],
      };
    }

    return { passed: true, issues: [], warnings: [] };
  },
};

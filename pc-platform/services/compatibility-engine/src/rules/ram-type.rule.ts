import type { BuildComponents } from '@pc-platform/types';
import type { CompatibilityRule, RuleResult } from './rule.interface';

/**
 * RAM Type Rule
 *
 * Ensures RAM type matches what the motherboard supports.
 * DDR5 RAM cannot be used in a DDR4 motherboard and vice versa.
 */
export const ramTypeRule: CompatibilityRule = {
  id: 'ram-type',
  name: 'RAM Type Compatibility',
  description: 'Ensures RAM generation (DDR4/DDR5) matches motherboard specification',

  check(components: BuildComponents): RuleResult {
    const { motherboard, ram } = components;

    if (!motherboard || !ram || ram.length === 0) {
      return { passed: true, issues: [], warnings: [] };
    }

    const mbRamType = motherboard.specs['ramType'] as string | undefined;
    if (!mbRamType) return { passed: true, issues: [], warnings: [] };

    const issues = ram
      .filter((stick) => {
        const stickType = stick.specs['ramType'] as string | undefined;
        return stickType && stickType !== mbRamType;
      })
      .map((stick) => ({
        severity: 'error' as const,
        rule: 'ram-type',
        message: `${stick.name} is ${stick.specs['ramType'] as string}, but ${motherboard.name} supports ${mbRamType} only.`,
        components: [stick.productId, motherboard.productId],
      }));

    return {
      passed: issues.length === 0,
      issues,
      warnings: [],
    };
  },
};

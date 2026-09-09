import type { BuildComponents } from '@pc-platform/types';
import type { CompatibilityRule, RuleResult } from './rule.interface';

// Form factor compatibility: smaller cases accept smaller boards
const FORM_FACTOR_COMPATIBILITY: Record<string, string[]> = {
  ATX: ['ATX'],
  EATX: ['ATX', 'EATX'],
  'Micro-ATX': ['ATX', 'Micro-ATX'],
  'Mini-ITX': ['ATX', 'Micro-ATX', 'Mini-ITX'],
};

/**
 * Case Form Factor Rule
 *
 * Validates that the motherboard form factor fits in the case.
 *
 * Examples:
 *   - ATX motherboard in ATX case → PASS
 *   - ATX motherboard in Micro-ATX case → ERROR
 *   - Micro-ATX motherboard in ATX case → PASS (ATX cases fit mATX boards)
 */
export const caseFormFactorRule: CompatibilityRule = {
  id: 'case-form-factor',
  name: 'Case Form Factor Compatibility',
  description: 'Validates that the motherboard fits inside the selected case',

  check(components: BuildComponents): RuleResult {
    const { case: pcCase, motherboard } = components;

    if (!pcCase || !motherboard) {
      return { passed: true, issues: [], warnings: [] };
    }

    const caseFormFactor = pcCase.specs['formFactor'] as string | undefined;
    const mbFormFactor = motherboard.specs['formFactor'] as string | undefined;

    if (!caseFormFactor || !mbFormFactor) {
      return { passed: true, issues: [], warnings: [] };
    }

    const supportedBoards = FORM_FACTOR_COMPATIBILITY[caseFormFactor] ?? [caseFormFactor];

    if (!supportedBoards.includes(mbFormFactor)) {
      return {
        passed: false,
        issues: [
          {
            severity: 'error',
            rule: 'case-form-factor',
            message: `${motherboard.name} (${mbFormFactor}) does not fit in ${pcCase.name} (${caseFormFactor} case).`,
            components: [pcCase.productId, motherboard.productId],
          },
        ],
        warnings: [],
      };
    }

    return { passed: true, issues: [], warnings: [] };
  },
};

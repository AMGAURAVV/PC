import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';
import type { FormFactor } from '../parser/specs.interface';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

// Hierarchy of form factors: larger cases accommodate smaller motherboards
const FORM_FACTOR_EXPANSION: Record<string, FormFactor[]> = {
  'E-ATX': ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX'],
  ATX: ['ATX', 'Micro-ATX', 'Mini-ITX'],
  'Micro-ATX': ['Micro-ATX', 'Mini-ITX'],
  'Mini-ITX': ['Mini-ITX'],
};

export const motherboardCaseFormFactorRule: CompatibilityRule = {
  id: 'motherboard-case-form-factor',
  name: 'Motherboard / Case Form Factor Compatibility',
  description: 'Ensures the motherboard physical dimensions and standoff mounting pattern are supported by the case',
  category: CompatibilityCategory.PHYSICAL_CLEARANCE,
  priority: 40,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.motherboard && !!ctx.normalized.case;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const mb = ctx.normalized.motherboard!;
    const pcCase = ctx.normalized.case!;

    if (!mb.formFactor || pcCase.supportedFormFactors.length === 0) {
      return {
        passed: false,
        status: 'unknown',
        issues: [
          {
            severity: 'unknown',
            category: CompatibilityCategory.PHYSICAL_CLEARANCE,
            ruleId: 'motherboard-case-form-factor',
            rule: 'motherboard-case-form-factor',
            title: 'Unknown Form Factor Specification',
            explanation: `Form factor metadata is missing for motherboard (${mb.formFactor ?? 'missing'}) or case (${pcCase.supportedFormFactors.join(', ') || 'missing'}).`,
            message: `Missing form factor metadata for motherboard or case.`,
            affectedComponents: [mb.productId, pcCase.productId],
            components: [mb.productId, pcCase.productId],
            suggestedResolution: 'Specify standard form factors (e.g. ATX, Micro-ATX, Mini-ITX).',
          },
        ],
        warnings: [],
      };
    }

    // Expand case supported form factors using standard hierarchy
    const allSupportedByCase = new Set<string>();
    for (const ff of pcCase.supportedFormFactors) {
      allSupportedByCase.add(ff.toUpperCase());
      const subFactors = FORM_FACTOR_EXPANSION[ff] || [];
      for (const sub of subFactors) {
        allSupportedByCase.add(sub.toUpperCase());
      }
    }

    const mbUpper = mb.formFactor.toUpperCase();
    if (!allSupportedByCase.has(mbUpper)) {
      return {
        passed: false,
        status: 'incompatible',
        issues: [
          {
            severity: 'error',
            category: CompatibilityCategory.PHYSICAL_CLEARANCE,
            ruleId: 'motherboard-case-form-factor',
            rule: 'motherboard-case-form-factor',
            title: 'Motherboard Form Factor Incompatible with Case',
            explanation: `${mb.name} is a ${mb.formFactor} motherboard, but ${pcCase.name} only supports: ${pcCase.supportedFormFactors.join(', ')}. The motherboard cannot physically fit or align with the internal standoff mounts.`,
            message: `${mb.formFactor} motherboard does not fit in a ${pcCase.supportedFormFactors.join('/')} case.`,
            affectedComponents: [mb.productId, pcCase.productId],
            components: [mb.productId, pcCase.productId],
            suggestedResolution: `Choose a case that supports ${mb.formFactor} motherboards, or select a motherboard with a smaller form factor compatible with ${pcCase.name}.`,
          },
        ],
        warnings: [],
      };
    }

    return { passed: true, issues: [], warnings: [] };
  },
};

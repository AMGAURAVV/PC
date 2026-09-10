import type { CompatibilityCategory, CompatibilityIssueItem, CompatibilityStatus } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

export interface RuleEvaluationResult {
  passed: boolean;
  status?: CompatibilityStatus;
  issues: CompatibilityIssueItem[];
  warnings: CompatibilityIssueItem[];
  info?: CompatibilityIssueItem[];
}

export interface CompatibilityRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: CompatibilityCategory;
  readonly priority: number;

  /**
   * Fast condition pre-check.
   * Determines if the rule should evaluate for the current build.
   * If false, this rule is skipped in the evaluation pipeline.
   */
  condition(context: RuleContext): boolean;

  /**
   * Evaluates compatibility against structured component specifications.
   * Does NOT assume compatibility from marketing names.
   */
  evaluate(context: RuleContext): RuleEvaluationResult;
}

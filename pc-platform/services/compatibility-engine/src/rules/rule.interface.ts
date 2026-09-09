import type { BuildComponents, CompatibilityIssue, CompatibilityWarning } from '@pc-platform/types';

export interface RuleResult {
  passed: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
}

export interface CompatibilityRule {
  id: string;
  name: string;
  description: string;
  check(components: BuildComponents): RuleResult;
}

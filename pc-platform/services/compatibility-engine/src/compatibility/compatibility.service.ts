import { Injectable } from '@nestjs/common';
import type {
  BuildComponents,
  CompatibilityResult,
  CompatibilityIssue,
  CompatibilityWarning,
} from '@pc-platform/types';

// Import all rules
import { cpuSocketRule } from '../rules/cpu-socket.rule';
import { ramTypeRule } from '../rules/ram-type.rule';
import { psuWattageRule } from '../rules/psu-wattage.rule';
import { caseFormFactorRule } from '../rules/case-form-factor.rule';
import type { CompatibilityRule } from '../rules/rule.interface';

/**
 * CompatibilityService — Orchestrates rule checks.
 *
 * Runs every registered rule against the provided components.
 * Rules are pure functions — no database, no HTTP, no side effects.
 *
 * Adding a new rule:
 *   1. Create src/rules/<rule>.rule.ts
 *   2. Import and add to the `rules` array below
 *   3. Write tests in <rule>.rule.spec.ts
 */
@Injectable()
export class CompatibilityService {
  private readonly rules: CompatibilityRule[] = [
    cpuSocketRule,
    ramTypeRule,
    psuWattageRule,
    caseFormFactorRule,
  ];

  check(components: BuildComponents): CompatibilityResult {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];

    for (const rule of this.rules) {
      const result = rule.check(components);
      issues.push(...result.issues);
      warnings.push(...result.warnings);
    }

    const compatible = issues.length === 0;
    const summary = compatible
      ? `Build is compatible. ${warnings.length} warning(s).`
      : `Build has ${issues.length} compatibility error(s) and ${warnings.length} warning(s).`;

    return { compatible, issues, warnings, summary };
  }
}

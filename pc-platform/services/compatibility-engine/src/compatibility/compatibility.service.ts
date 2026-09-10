import { Injectable } from '@nestjs/common';
import type {
  BuildComponents,
  CompatibilityResult,
  CompatibilityStatus,
  CompatibilityIssueItem,
  CompatibilityTelemetry,
} from '@pc-platform/types';

import { RuleContext } from '../parser/rule-context';
import { ALL_COMPATIBILITY_RULES } from '../rules';
import type { CompatibilityRule } from '../rules/rule.interface';

/**
 * CompatibilityService — Orchestrates the PC compatibility evaluation pipeline.
 *
 * Execution flow:
 *   1. Raw input specs -> SpecNormalizer -> NormalizedBuild (typed specifications)
 *   2. Compute aggregate system metrics (TDP, RAM, slot counts, power connectors)
 *   3. Build immutable RuleContext
 *   4. Filter and execute registered rules:
 *        Rule -> condition(ctx) -> evaluate(ctx) -> RuleResult
 *   5. Derive deterministic compatibility status:
 *        'incompatible' | 'warning' | 'unknown' | 'compatible'
 *   6. Synthesize comprehensive report with telemetry
 */
@Injectable()
export class CompatibilityService {
  private readonly rules: CompatibilityRule[] = ALL_COMPATIBILITY_RULES;

  /**
   * Evaluates a PC build configuration across all 22 compatibility checks.
   */
  public check(components: BuildComponents): CompatibilityResult {
    const startTime = Date.now();
    const context = new RuleContext(components);

    const issues: CompatibilityIssueItem[] = [];
    const warnings: CompatibilityIssueItem[] = [];
    const info: CompatibilityIssueItem[] = [];

    let evaluatedRulesCount = 0;
    let passedRulesCount = 0;
    let failedRulesCount = 0;
    let warningRulesCount = 0;
    let unknownRulesCount = 0;

    for (const rule of this.rules) {
      // Step 1: Condition pre-filter
      if (!rule.condition(context)) {
        continue;
      }

      evaluatedRulesCount++;

      // Step 2: Evaluation
      const result = rule.evaluate(context);

      // Collect issues, warnings, info
      issues.push(...result.issues);
      warnings.push(...result.warnings);
      if (result.info) {
        info.push(...result.info);
      }

      // Tally counters
      if (!result.passed) {
        if (result.status === 'unknown' || result.issues.some((i) => i.severity === 'unknown')) {
          unknownRulesCount++;
        } else {
          failedRulesCount++;
        }
      } else if (result.warnings.length > 0) {
        if (result.warnings.some((w) => w.severity === 'unknown')) {
          unknownRulesCount++;
        } else {
          warningRulesCount++;
        }
      } else {
        passedRulesCount++;
      }
    }

    // Determine overall status
    const hasErrors = issues.some((i) => i.severity === 'error');
    const hasWarnings = warnings.some((w) => w.severity === 'warning');
    const hasUnknowns = issues.some((i) => i.severity === 'unknown') || warnings.some((w) => w.severity === 'unknown');

    let status: CompatibilityStatus;
    let compatible: boolean;

    if (hasErrors) {
      status = 'incompatible';
      compatible = false;
    } else if (hasUnknowns) {
      status = 'unknown';
      compatible = false;
    } else if (hasWarnings) {
      status = 'warning';
      compatible = true;
    } else {
      status = 'compatible';
      compatible = true;
    }

    // Generate descriptive summary
    const summary = this.generateSummary(status, issues, warnings, info);

    const telemetry: CompatibilityTelemetry = {
      evaluatedRulesCount,
      passedRulesCount,
      failedRulesCount,
      warningRulesCount,
      unknownRulesCount,
      executionTimeMs: Date.now() - startTime,
    };

    return {
      status,
      compatible,
      issues,
      warnings,
      info,
      summary,
      telemetry,
    };
  }

  private generateSummary(
    status: CompatibilityStatus,
    issues: CompatibilityIssueItem[],
    warnings: CompatibilityIssueItem[],
    info: CompatibilityIssueItem[]
  ): string {
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warnCount = warnings.filter((w) => w.severity === 'warning').length;
    const unknownCount =
      issues.filter((i) => i.severity === 'unknown').length + warnings.filter((w) => w.severity === 'unknown').length;

    switch (status) {
      case 'incompatible':
        return `Build is incompatible: ${errorCount} error(s), ${warnCount} warning(s)${unknownCount > 0 ? `, ${unknownCount} unknown check(s)` : ''}.`;
      case 'warning':
        return `Build is compatible with ${warnCount} advisory warning(s).`;
      case 'unknown':
        return `Build compatibility is unknown: ${unknownCount} check(s) lack required technical specification data.`;
      case 'compatible':
        return `Build is fully compatible. All checked hardware specifications match.`;
    }
  }
}

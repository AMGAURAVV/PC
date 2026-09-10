import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const radiatorCaseFitRule: CompatibilityRule = {
  id: 'radiator-case-fit',
  name: 'Liquid Cooler Radiator Mount Compatibility',
  description: 'Verifies that liquid cooler radiator dimensions can be mounted in at least one valid case radiator position',
  category: CompatibilityCategory.COOLING,
  priority: 38,

  condition(ctx: RuleContext): boolean {
    const cooler = ctx.normalized.cpuCooler;
    return !!cooler && cooler.coolerType === 'Liquid' && !!ctx.normalized.case;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const cooler = ctx.normalized.cpuCooler!;
    const pcCase = ctx.normalized.case!;

    const radSize = cooler.radiatorSizeMm;

    if (!radSize) {
      return {
        passed: false,
        status: 'unknown',
        issues: [
          {
            severity: 'unknown',
            category: CompatibilityCategory.COOLING,
            ruleId: 'radiator-case-fit',
            rule: 'radiator-case-fit',
            title: 'Liquid Cooler Radiator Size Missing',
            explanation: `Liquid cooler ${cooler.name} does not specify its radiator size (e.g. 240mm, 280mm, 360mm, 420mm). Chassis mounting compatibility cannot be validated.`,
            message: `Missing radiator size for ${cooler.name}.`,
            affectedComponents: [cooler.productId],
            components: [cooler.productId],
            suggestedResolution: 'Specify liquid cooler radiator size (e.g., 240mm, 360mm).',
          },
        ],
        warnings: [],
      };
    }

    // Check case radiator mounts
    const supportedPositions = pcCase.radiatorSupport.filter((pos) => pos.maxMm >= radSize);
    const maxCaseRad = pcCase.maxRadiatorSizeMm || Math.max(0, ...pcCase.radiatorSupport.map((p) => p.maxMm));

    if (supportedPositions.length === 0 && (maxCaseRad === 0 || radSize > maxCaseRad)) {
      return {
        passed: false,
        status: 'incompatible',
        issues: [
          {
            severity: 'error',
            category: CompatibilityCategory.COOLING,
            ruleId: 'radiator-case-fit',
            rule: 'radiator-case-fit',
            title: 'Radiator Exceeds Case Mounting Capability',
            explanation: `The liquid cooler ${cooler.name} requires a ${radSize}mm radiator mount, but ${pcCase.name} only supports radiators up to ${maxCaseRad > 0 ? `${maxCaseRad}mm` : 'unsupported'}. The radiator cannot be mounted in this chassis.`,
            message: `${radSize}mm radiator cannot fit in ${pcCase.name} (max supported: ${maxCaseRad}mm).`,
            affectedComponents: [cooler.productId, pcCase.productId],
            components: [cooler.productId, pcCase.productId],
            suggestedResolution: `Choose a liquid cooler with a ${maxCaseRad}mm or smaller radiator, or select a case that supports ${radSize}mm radiators.`,
          },
        ],
        warnings: [],
      };
    }

    // Inform user of available mounting positions
    const posList = supportedPositions.map((p) => `${p.location} (up to ${p.maxMm}mm)`).join(', ');
    const info = [
      {
        severity: 'info' as const,
        category: CompatibilityCategory.COOLING,
        ruleId: 'radiator-case-fit',
        rule: 'radiator-case-fit',
        title: 'Radiator Mount Positions Available',
        explanation: `${radSize}mm radiator can be installed in ${pcCase.name} in the following location(s): ${posList || 'supported mount'}.`,
        message: `${radSize}mm radiator fits in ${pcCase.name}.`,
        affectedComponents: [cooler.productId, pcCase.productId],
        components: [cooler.productId, pcCase.productId],
        suggestedResolution: 'Verify clearance with tall motherboard VRM heatsinks or high-profile RAM when mounting on top.',
      },
    ];

    return { passed: true, issues: [], warnings: [], info };
  },
};

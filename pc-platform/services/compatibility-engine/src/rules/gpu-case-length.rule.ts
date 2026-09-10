import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const gpuCaseLengthRule: CompatibilityRule = {
  id: 'gpu-case-length',
  name: 'GPU Physical Length Clearance',
  description: 'Validates that the graphics card physical length fits inside the case GPU clearance chamber',
  category: CompatibilityCategory.PHYSICAL_CLEARANCE,
  priority: 30,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.gpu && !!ctx.normalized.case;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const gpu = ctx.normalized.gpu!;
    const pcCase = ctx.normalized.case!;

    if (!gpu.lengthMm || !pcCase.maxGpuLengthMm) {
      return {
        passed: false,
        status: 'unknown',
        issues: [
          {
            severity: 'unknown',
            category: CompatibilityCategory.PHYSICAL_CLEARANCE,
            ruleId: 'gpu-case-length',
            rule: 'gpu-case-length',
            title: 'Unknown GPU Clearance Specification',
            explanation: `Unable to verify GPU physical fit: GPU length is ${gpu.lengthMm ? `${gpu.lengthMm}mm` : 'missing'} and case max GPU clearance is ${pcCase.maxGpuLengthMm ? `${pcCase.maxGpuLengthMm}mm` : 'missing'}.`,
            message: `Missing dimensions for GPU clearance verification.`,
            affectedComponents: [gpu.productId, pcCase.productId],
            components: [gpu.productId, pcCase.productId],
            suggestedResolution: 'Specify GPU card length and case maximum GPU clearance in millimeters.',
          },
        ],
        warnings: [],
      };
    }

    let effectiveClearanceMm = pcCase.maxGpuLengthMm;

    // If a front-mounted liquid cooler is installed in cases where front mount reduces GPU clearance
    const cooler = ctx.normalized.cpuCooler;
    if (cooler?.coolerType === 'Liquid' && cooler.radiatorSizeMm) {
      const topMount = pcCase.radiatorSupport.find((r) => r.location === 'top' && r.maxMm >= cooler.radiatorSizeMm!);
      const frontMount = pcCase.radiatorSupport.find((r) => r.location === 'front' && r.maxMm >= cooler.radiatorSizeMm!);
      // If forced to mount to front because top mount is unavailable or smaller
      if (!topMount && frontMount) {
        // Typical radiator (27mm) + standard 120/140mm fan (25mm) = 52mm reduction
        effectiveClearanceMm -= 55;
      }
    }

    if (gpu.lengthMm > effectiveClearanceMm) {
      return {
        passed: false,
        status: 'incompatible',
        issues: [
          {
            severity: 'error',
            category: CompatibilityCategory.PHYSICAL_CLEARANCE,
            ruleId: 'gpu-case-length',
            rule: 'gpu-case-length',
            title: 'GPU Too Long for Case',
            explanation: `The graphics card ${gpu.name} is ${gpu.lengthMm}mm long, but ${pcCase.name} only provides ${effectiveClearanceMm}mm of clearance${effectiveClearanceMm < pcCase.maxGpuLengthMm ? ' (accounting for front-mounted radiator)' : ''}. The card will collide with the front panel or drive cages and cannot be installed.`,
            message: `GPU length (${gpu.lengthMm}mm) exceeds case clearance (${effectiveClearanceMm}mm).`,
            affectedComponents: [gpu.productId, pcCase.productId],
            components: [gpu.productId, pcCase.productId],
            suggestedResolution: `Select a graphics card shorter than ${effectiveClearanceMm}mm, or choose a chassis with greater GPU clearance.`,
          },
        ],
        warnings: [],
      };
    }

    // Borderline clearance warning (within 10mm)
    const warnings = [];
    if (effectiveClearanceMm - gpu.lengthMm < 10) {
      warnings.push({
        severity: 'warning' as const,
        category: CompatibilityCategory.PHYSICAL_CLEARANCE,
        ruleId: 'gpu-case-length',
        rule: 'gpu-case-length',
        title: 'Extremely Tight GPU Clearance',
        explanation: `GPU length (${gpu.lengthMm}mm) is within 10mm of maximum case clearance (${effectiveClearanceMm}mm). Assembly may require careful angling and cable management during installation.`,
        message: `GPU clearance margin is very tight (${effectiveClearanceMm - gpu.lengthMm}mm remaining).`,
        affectedComponents: [gpu.productId, pcCase.productId],
        components: [gpu.productId, pcCase.productId],
        suggestedResolution: 'Ensure power cables and front intake fans do not obstruct GPU installation.',
      });
    }

    return {
      passed: true,
      status: warnings.length > 0 ? 'warning' : 'compatible',
      issues: [],
      warnings,
    };
  },
};

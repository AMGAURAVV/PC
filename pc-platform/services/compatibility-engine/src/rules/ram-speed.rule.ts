import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

export const ramSpeedRule: CompatibilityRule = {
  id: 'ram-speed',
  name: 'RAM Speed Compatibility & Downclocking Check',
  description: 'Evaluates RAM transfer rate against motherboard maximum rated speed and CPU memory controller native specification',
  category: CompatibilityCategory.MEMORY,
  priority: 28,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.motherboard && ctx.normalized.ram.length > 0;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const mb = ctx.normalized.motherboard!;
    const cpu = ctx.normalized.cpu;
    const warnings = [];
    const info = [];

    for (const stick of ctx.normalized.ram) {
      if (!stick.speedMhz) {
        warnings.push({
          severity: 'unknown' as const,
          category: CompatibilityCategory.MEMORY,
          ruleId: 'ram-speed',
          rule: 'ram-speed',
          title: 'Unknown RAM Speed Specification',
          explanation: `Memory kit ${stick.name} does not have a rated frequency (MHz) specified.`,
          message: `Missing memory speed specification for ${stick.name}.`,
          affectedComponents: [stick.productId],
          components: [stick.productId],
          suggestedResolution: 'Verify RAM rated frequency (e.g. 5600MHz, 6000MHz).',
        });
        continue;
      }

      // 1. Exceeding motherboard max OC speed
      if (mb.maxRamSpeedMhz && stick.speedMhz > mb.maxRamSpeedMhz) {
        warnings.push({
          severity: 'warning' as const,
          category: CompatibilityCategory.MEMORY,
          ruleId: 'ram-speed',
          rule: 'ram-speed',
          title: 'RAM Speed Exceeds Motherboard Maximum Rating',
          explanation: `${stick.name} is rated for ${stick.speedMhz}MHz, but ${mb.name} lists a maximum memory frequency of ${mb.maxRamSpeedMhz}MHz. The memory will automatically downclock to ${mb.maxRamSpeedMhz}MHz or may require manual timing adjustments to boot stably.`,
          message: `RAM speed (${stick.speedMhz}MHz) exceeds motherboard max rating (${mb.maxRamSpeedMhz}MHz); downclocking will occur.`,
          affectedComponents: [stick.productId, mb.productId],
          components: [stick.productId, mb.productId],
          suggestedResolution: `Choose a memory kit rated up to ${mb.maxRamSpeedMhz}MHz, or select a higher-end motherboard.`,
        });
      }

      // 2. High frequency EXPO/XMP advisory relative to CPU native IMC
      if (cpu?.maxMemorySpeedMhz && stick.speedMhz > cpu.maxMemorySpeedMhz) {
        info.push({
          severity: 'info' as const,
          category: CompatibilityCategory.MEMORY,
          ruleId: 'ram-speed',
          rule: 'ram-speed',
          title: 'Overclocked Memory Profile (XMP / AMD EXPO) Required',
          explanation: `${stick.name} rated speed (${stick.speedMhz}MHz) exceeds ${cpu.name} native memory controller base speed (${cpu.maxMemorySpeedMhz}MHz). You must enable Intel XMP or AMD EXPO in BIOS to achieve rated speed. Speeds above 6000MHz may depend on CPU silicon quality.`,
          message: `${stick.speedMhz}MHz exceeds CPU native base speed (${cpu.maxMemorySpeedMhz}MHz). XMP/EXPO profile must be enabled.`,
          affectedComponents: [stick.productId, cpu.productId],
          components: [stick.productId, cpu.productId],
          suggestedResolution: 'Enable XMP / EXPO memory profile in BIOS settings after assembly.',
        });
      }
    }

    return {
      passed: true,
      status: warnings.some((w) => w.severity === 'unknown') ? 'unknown' : warnings.length > 0 ? 'warning' : 'compatible',
      issues: [],
      warnings,
      info,
    };
  },
};

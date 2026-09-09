import type { BuildComponents } from '@pc-platform/types';
import type { CompatibilityRule, RuleResult } from './rule.interface';

/**
 * CPU Socket Rule
 *
 * Ensures the CPU socket matches the motherboard socket.
 *
 * Examples:
 *   - AMD Ryzen 7000 (AM5) + ASUS Z690 (LGA1700) → ERROR
 *   - AMD Ryzen 7000 (AM5) + MSI X670E (AM5) → PASS
 *
 * Tests: cpu-socket.rule.spec.ts
 */
export const cpuSocketRule: CompatibilityRule = {
  id: 'cpu-socket',
  name: 'CPU Socket Compatibility',
  description: 'Ensures the CPU socket type matches the motherboard socket type',

  check(components: BuildComponents): RuleResult {
    const { cpu, motherboard } = components;

    // Can't check without both components
    if (!cpu || !motherboard) {
      return { passed: true, issues: [], warnings: [] };
    }

    const cpuSocket = cpu.specs['socketType'] as string | undefined;
    const mbSocket = motherboard.specs['socketType'] as string | undefined;

    if (!cpuSocket || !mbSocket) {
      return { passed: true, issues: [], warnings: [] };
    }

    if (cpuSocket !== mbSocket) {
      return {
        passed: false,
        issues: [
          {
            severity: 'error',
            rule: 'cpu-socket',
            message: `${cpu.name} requires socket ${cpuSocket}, but ${motherboard.name} has socket ${mbSocket}. These are not compatible.`,
            components: [cpu.productId, motherboard.productId],
          },
        ],
        warnings: [],
      };
    }

    return { passed: true, issues: [], warnings: [] };
  },
};

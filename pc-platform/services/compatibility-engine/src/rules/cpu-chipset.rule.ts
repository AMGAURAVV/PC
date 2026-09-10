import { CompatibilityCategory } from '@pc-platform/types';

import type { RuleContext } from '../parser/rule-context';

import type { CompatibilityRule, RuleEvaluationResult } from './rule.interface';

// Known chipset families mapped to their valid sockets and supported CPU generations
const CHIPSET_SOCKET_MAP: Record<string, { socket: string; vendor: 'AMD' | 'INTEL' }> = {
  // AMD AM5
  A620: { socket: 'AM5', vendor: 'AMD' },
  B650: { socket: 'AM5', vendor: 'AMD' },
  B650E: { socket: 'AM5', vendor: 'AMD' },
  X670: { socket: 'AM5', vendor: 'AMD' },
  X670E: { socket: 'AM5', vendor: 'AMD' },
  B840: { socket: 'AM5', vendor: 'AMD' },
  B850: { socket: 'AM5', vendor: 'AMD' },
  X870: { socket: 'AM5', vendor: 'AMD' },
  X870E: { socket: 'AM5', vendor: 'AMD' },
  // AMD AM4
  A320: { socket: 'AM4', vendor: 'AMD' },
  B350: { socket: 'AM4', vendor: 'AMD' },
  X370: { socket: 'AM4', vendor: 'AMD' },
  B450: { socket: 'AM4', vendor: 'AMD' },
  X470: { socket: 'AM4', vendor: 'AMD' },
  A520: { socket: 'AM4', vendor: 'AMD' },
  B550: { socket: 'AM4', vendor: 'AMD' },
  X570: { socket: 'AM4', vendor: 'AMD' },
  // Intel LGA1700
  H610: { socket: 'LGA1700', vendor: 'INTEL' },
  B660: { socket: 'LGA1700', vendor: 'INTEL' },
  H670: { socket: 'LGA1700', vendor: 'INTEL' },
  Z690: { socket: 'LGA1700', vendor: 'INTEL' },
  B760: { socket: 'LGA1700', vendor: 'INTEL' },
  H770: { socket: 'LGA1700', vendor: 'INTEL' },
  Z790: { socket: 'LGA1700', vendor: 'INTEL' },
  // Intel LGA1851
  Z890: { socket: 'LGA1851', vendor: 'INTEL' },
  B860: { socket: 'LGA1851', vendor: 'INTEL' },
  // Intel LGA1200
  H410: { socket: 'LGA1200', vendor: 'INTEL' },
  B460: { socket: 'LGA1200', vendor: 'INTEL' },
  H470: { socket: 'LGA1200', vendor: 'INTEL' },
  Z490: { socket: 'LGA1200', vendor: 'INTEL' },
  H510: { socket: 'LGA1200', vendor: 'INTEL' },
  B560: { socket: 'LGA1200', vendor: 'INTEL' },
  Z590: { socket: 'LGA1200', vendor: 'INTEL' },
};

export const cpuChipsetRule: CompatibilityRule = {
  id: 'cpu-chipset',
  name: 'CPU Chipset Compatibility',
  description: 'Verifies motherboard chipset architecture compatibility with the selected CPU',
  category: CompatibilityCategory.CHIPSET,
  priority: 15,

  condition(ctx: RuleContext): boolean {
    return !!ctx.normalized.cpu && !!ctx.normalized.motherboard;
  },

  evaluate(ctx: RuleContext): RuleEvaluationResult {
    const cpu = ctx.normalized.cpu!;
    const mb = ctx.normalized.motherboard!;

    if (!mb.chipset) {
      // If motherboard chipset metadata is missing, emit an unknown notice
      return {
        passed: true,
        warnings: [
          {
            severity: 'unknown',
            category: CompatibilityCategory.CHIPSET,
            ruleId: 'cpu-chipset',
            rule: 'cpu-chipset',
            title: 'Motherboard Chipset Specification Missing',
            explanation: `Motherboard ${mb.name} does not have structured chipset specifications defined. Detailed chipset feature validation cannot be performed.`,
            message: `Chipset specification missing for ${mb.name}.`,
            affectedComponents: [mb.productId],
            components: [mb.productId],
            suggestedResolution: 'Verify motherboard chipset model to ensure full feature and bus compatibility.',
          },
        ],
        issues: [],
      };
    }

    const chipsetInfo = CHIPSET_SOCKET_MAP[mb.chipset];
    if (chipsetInfo && cpu.socketType) {
      if (chipsetInfo.socket !== cpu.socketType) {
        return {
          passed: false,
          status: 'incompatible',
          issues: [
            {
              severity: 'error',
              category: CompatibilityCategory.CHIPSET,
              ruleId: 'cpu-chipset',
              rule: 'cpu-chipset',
              title: 'Chipset Platform Incompatibility',
              explanation: `The motherboard chipset (${mb.chipset}) belongs to platform socket ${chipsetInfo.socket}, which cannot support the CPU (${cpu.name}) designed for socket ${cpu.socketType}.`,
              message: `Motherboard chipset ${mb.chipset} (${chipsetInfo.socket}) is incompatible with ${cpu.name} (${cpu.socketType}).`,
              affectedComponents: [cpu.productId, mb.productId],
              components: [cpu.productId, mb.productId],
              suggestedResolution: `Select a motherboard featuring a chipset designed for ${cpu.socketType}.`,
            },
          ],
          warnings: [],
        };
      }
    }

    return { passed: true, issues: [], warnings: [] };
  },
};
